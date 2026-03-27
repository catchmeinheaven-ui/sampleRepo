# PR Code Reviewer - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the PR Code Reviewer in your enterprise environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [CI/CD Integration](#cicd-integration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: Latest version

### Required Access

- GitHub repository with admin access
- Ability to create GitHub Actions workflows
- (Optional) OpenAI API account for AI-powered reviews

## GitHub Setup

### Option 1: Personal Access Token (Recommended for Testing)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set the following scopes:
   - `repo` (Full control of private repositories)
   - `write:discussion` (Read and write team discussions)
4. Copy the generated token
5. Add it as a repository secret named `GITHUB_TOKEN`

### Option 2: GitHub App (Recommended for Production)

1. **Create GitHub App**:
   - Go to Organization Settings → Developer settings → GitHub Apps
   - Click "New GitHub App"
   - Fill in the details:
     - Name: "PR Code Reviewer"
     - Homepage URL: Your repository URL
     - Webhook: Leave "Active" **unchecked** (we use GitHub Actions, not webhooks)

2. **Set Permissions**:
   - Repository permissions:
     - Contents: Read
     - Pull requests: Read & Write
     - Issues: Read & Write
   - **Note**: Since we're using GitHub Actions instead of webhooks, you don't need to subscribe to events. The GitHub Actions workflow will trigger automatically on PR events.

3. **Install the App**:
   - Install the app on your organization/repository
   - Note the App ID and generate a private key
   - Store these securely

4. **Configure Secrets**:
   ```bash
   # Add to repository secrets
   GITHUB_APP_ID=your_app_id
   GITHUB_APP_PRIVATE_KEY=your_private_key
   ```

### Option 3: GitHub Enterprise Server

For GitHub Enterprise Server installations:

1. Ensure your server version supports GitHub Actions
2. Configure the Actions runner on your infrastructure
3. Use the same token/app setup as above
4. Update the API endpoint in the code if using a custom domain

## Installation

### Step 1: Add to Your Repository

```bash
# Navigate to your repository
cd /path/to/your/repository

# Create the pr-code-reviewer directory
mkdir -p pr-code-reviewer

# Copy all files from the pr-code-reviewer package
cp -r /path/to/pr-code-reviewer/* pr-code-reviewer/
```

### Step 2: Install Dependencies

```bash
cd pr-code-reviewer
npm install
```

### Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your credentials
nano .env
```

Required environment variables:
```bash
GITHUB_TOKEN=your_github_token_here
```

Optional but recommended:
```bash
OPENAI_API_KEY=your_openai_key_here
LOG_LEVEL=info
```

### Step 4: Test the Installation

```bash
# Run a test to verify everything is working
npm test

# Or run a manual review (requires PR environment variables)
npm start
```

## Configuration

### Review Configuration

Edit `src/config/review-config.yml` to customize review behavior:

#### Basic Settings

```yaml
review_settings:
  # Which checks to enable
  enabled_checks:
    - security
    - performance
    - maintainability
    - style
  
  # Minimum severity to post comments
  min_severity_to_comment: medium
  
  # Auto-approve PRs with no issues
  auto_approve_on_success: false
  
  # Request changes if critical issues found
  request_changes_on_critical: true
```

#### Security Configuration

```yaml
security:
  enabled: true
  checks:
    - hardcoded_credentials
    - sql_injection
    - xss_vulnerabilities
    - insecure_dependencies
    - sensitive_data_exposure
```

#### Custom Patterns

Add custom security patterns:

```yaml
security:
  patterns:
    credentials:
      - 'password\s*=\s*["\'].*["\']'
      - 'api[_-]?key\s*=\s*["\'].*["\']'
      - 'your_custom_pattern_here'
```

#### Performance Thresholds

Adjust performance thresholds:

```yaml
performance:
  thresholds:
    max_function_lines: 100
    max_file_lines: 500
    max_complexity: 15
    max_nested_loops: 3
```

#### File Exclusions

Exclude files from review:

```yaml
exclusions:
  paths:
    - 'node_modules/**'
    - 'dist/**'
    - 'build/**'
    - 'vendor/**'
    - 'your_custom_path/**'
  
  file_patterns:
    - '*.lock'
    - '*.log'
    - '*.min.js'
    - 'your_pattern.*'
```

### AI Review Configuration

Enable and configure AI-powered reviews:

```yaml
ai_review:
  enabled: true
  model: 'gpt-4'  # or 'gpt-3.5-turbo' for faster/cheaper reviews
  max_tokens: 4000
  temperature: 0.3
  
  prompts:
    system: |
      Your custom system prompt here
```

## CI/CD Integration

### GitHub Actions (Default)

The workflow is automatically configured in `.github/workflows/pr-review.yml`.

**To customize the workflow:**

```yaml
# .github/workflows/pr-review.yml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
      - develop
      - release/*  # Add custom branches
```

**Add repository secrets:**
1. Go to Repository Settings → Secrets and variables → Actions
2. Add `OPENAI_API_KEY` (if using AI reviews)
3. `GITHUB_TOKEN` is automatically provided

### Jenkins Integration

Create a `Jenkinsfile` in your repository:

```groovy
pipeline {
    agent any
    
    environment {
        GITHUB_TOKEN = credentials('github-token')
        OPENAI_API_KEY = credentials('openai-api-key')
    }
    
    stages {
        stage('Setup') {
            steps {
                dir('pr-code-reviewer') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Code Review') {
            when {
                changeRequest()
            }
            steps {
                dir('pr-code-reviewer') {
                    sh '''
                        export PR_NUMBER=${CHANGE_ID}
                        export REPO_OWNER=${GIT_ORGANIZATION}
                        export REPO_NAME=${GIT_REPOSITORY}
                        export BASE_REF=${CHANGE_TARGET}
                        export HEAD_REF=${CHANGE_BRANCH}
                        npm start
                    '''
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'pr-code-reviewer/review-output/**', allowEmptyArchive: true
        }
    }
}
```

### GitLab CI Integration

Create or update `.gitlab-ci.yml`:

```yaml
stages:
  - review

code_review:
  stage: review
  image: node:18
  before_script:
    - cd pr-code-reviewer
    - npm ci
  script:
    - |
      export PR_NUMBER=$CI_MERGE_REQUEST_IID
      export REPO_OWNER=$CI_PROJECT_NAMESPACE
      export REPO_NAME=$CI_PROJECT_NAME
      export BASE_REF=$CI_MERGE_REQUEST_TARGET_BRANCH_NAME
      export HEAD_REF=$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME
      npm start
  only:
    - merge_requests
  artifacts:
    paths:
      - pr-code-reviewer/review-output/
    expire_in: 30 days
```

### Azure DevOps Integration

Create `azure-pipelines.yml`:

```yaml
trigger:
  - none

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    cd pr-code-reviewer
    npm ci
  displayName: 'Install dependencies'

- script: |
    cd pr-code-reviewer
    export PR_NUMBER=$(System.PullRequest.PullRequestNumber)
    export REPO_OWNER=$(Build.Repository.Name | cut -d'/' -f1)
    export REPO_NAME=$(Build.Repository.Name | cut -d'/' -f2)
    export BASE_REF=$(System.PullRequest.TargetBranch)
    export HEAD_REF=$(System.PullRequest.SourceBranch)
    npm start
  displayName: 'Run code review'
  env:
    GITHUB_TOKEN: $(GITHUB_TOKEN)
    OPENAI_API_KEY: $(OPENAI_API_KEY)

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'pr-code-reviewer/review-output'
    artifactName: 'review-results'
```

### CircleCI Integration

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  code-review:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "pr-code-reviewer/package.json" }}
      - run:
          name: Install dependencies
          command: |
            cd pr-code-reviewer
            npm ci
      - save_cache:
          paths:
            - pr-code-reviewer/node_modules
          key: v1-dependencies-{{ checksum "pr-code-reviewer/package.json" }}
      - run:
          name: Run code review
          command: |
            cd pr-code-reviewer
            npm start
      - store_artifacts:
          path: pr-code-reviewer/review-output

workflows:
  version: 2
  pr-review:
    jobs:
      - code-review:
          filters:
            branches:
              ignore: main
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Error**: `Bad credentials` or `401 Unauthorized`

**Solution**:
- Verify your GitHub token is correct
- Check token permissions include `repo` and `pull_requests:write`
- Ensure token hasn't expired
- For GitHub Enterprise, verify the API endpoint

#### 2. Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
cd pr-code-reviewer
rm -rf node_modules package-lock.json
npm install
```

#### 3. AI Review Failures

**Error**: `OpenAI API error` or timeouts

**Solution**:
- Verify your OpenAI API key is valid
- Check your API quota/billing
- Reduce `max_tokens` in configuration
- Set `ai_review.enabled: false` to disable AI reviews temporarily

#### 4. GitHub Actions Workflow Not Triggering

**Solution**:
- Verify the workflow file is in `.github/workflows/`
- Check branch protection rules
- Ensure Actions are enabled in repository settings
- Review workflow permissions in repository settings

#### 5. Too Many Comments

**Error**: GitHub API rate limit exceeded

**Solution**:
- Increase `min_severity_to_comment` to `high` or `critical`
- Reduce the number of enabled checks
- Add more file exclusions
- Implement comment batching (already included)

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm start
```

Check logs in `review-output/combined.log`

### Testing Configuration

Test your configuration without posting to GitHub:

```bash
# Set dry-run mode (you'll need to add this feature)
DRY_RUN=true npm start
```

### Getting Help

1. Check the logs in `review-output/`
2. Review the configuration in `src/config/review-config.yml`
3. Verify environment variables in `.env`
4. Check GitHub Actions logs in the Actions tab
5. Create an issue in the repository with:
   - Error message
   - Configuration (redact sensitive data)
   - Steps to reproduce

## Best Practices

1. **Start with minimal checks** and gradually enable more
2. **Set appropriate severity thresholds** to avoid noise
3. **Customize exclusions** for your project structure
4. **Review AI suggestions** before applying them
5. **Monitor API usage** to avoid rate limits
6. **Keep dependencies updated** for security
7. **Test in a development branch** before production deployment

## Next Steps

After setup:
1. Create a test PR to verify the system works
2. Adjust configuration based on initial results
3. Train your team on interpreting review comments
4. Set up monitoring for review failures
5. Establish a process for handling false positives

---

For more information, see the main [README.md](../README.md)