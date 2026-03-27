# PR Code Reviewer - Automated Code Review Assistant

An intelligent, automated code review system that integrates with GitHub Enterprise and CI/CD pipelines to provide comprehensive code analysis and suggestions for pull requests.

## 🚀 Features

- **Automated PR Reviews**: Automatically reviews pull requests when opened or updated
- **Multi-Category Analysis**:
  - 🔒 **Security**: Detects vulnerabilities, hardcoded credentials, SQL injection, XSS
  - ⚡ **Performance**: Identifies inefficient code, memory leaks, blocking operations
  - 🔧 **Maintainability**: Checks code complexity, duplication, naming conventions
  - 🎨 **Style**: Enforces consistent formatting and coding standards
  - 🤖 **AI-Powered**: Optional GPT-4 integration for intelligent suggestions
- **GitHub Integration**: Posts inline comments, creates reviews, adds labels
- **Configurable Rules**: Customizable review standards via YAML configuration
- **Multi-Language Support**: JavaScript, TypeScript, Java, Python, Go, and more
- **CI/CD Ready**: Seamless integration with GitHub Actions and enterprise pipelines

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- GitHub Personal Access Token or GitHub App credentials
- (Optional) OpenAI API key for AI-powered reviews

## 🔧 Installation

### 1. Clone or Copy the Repository

```bash
# Copy the pr-code-reviewer directory to your repository
cp -r pr-code-reviewer /path/to/your/repo/
cd /path/to/your/repo/pr-code-reviewer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `pr-code-reviewer` directory:

```bash
# Required
GITHUB_TOKEN=your_github_token_here

# Optional - for AI-powered reviews
OPENAI_API_KEY=your_openai_api_key_here

# Optional - logging level
LOG_LEVEL=info

# Optional - configuration overrides
REVIEW_MIN_SEVERITY=medium
REVIEW_AUTO_APPROVE=false
AI_MODEL=gpt-4
```

### 4. Configure Review Rules

Edit `src/config/review-config.yml` to customize review standards:

```yaml
review_settings:
  enabled_checks:
    - security
    - performance
    - maintainability
    - style
  min_severity_to_comment: medium
  auto_approve_on_success: false
```

## 🚀 Usage

### GitHub Actions Integration

The system automatically runs on pull requests via GitHub Actions. The workflow is defined in `.github/workflows/pr-review.yml`.

**Required GitHub Secrets:**
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `OPENAI_API_KEY` - (Optional) For AI-powered reviews

### Manual Execution

You can also run reviews manually:

```bash
# Set environment variables
export GITHUB_TOKEN=your_token
export PR_NUMBER=123
export REPO_OWNER=your-org
export REPO_NAME=your-repo
export BASE_REF=main
export HEAD_REF=feature-branch
export BASE_SHA=abc123
export HEAD_SHA=def456

# Run the review
npm start
```

### Local Development

```bash
# Run with development logging
LOG_LEVEL=debug npm start

# Run specific checks only
ENABLE_SECURITY_CHECK=true ENABLE_PERFORMANCE_CHECK=false npm start
```

## 📁 Project Structure

```
pr-code-reviewer/
├── .github/
│   └── workflows/
│       └── pr-review.yml          # GitHub Actions workflow
├── src/
│   ├── config/
│   │   └── review-config.yml      # Review configuration
│   ├── reviewers/
│   │   ├── CodeReviewer.js        # Main orchestrator
│   │   ├── SecurityReviewer.js    # Security checks
│   │   ├── PerformanceReviewer.js # Performance analysis
│   │   ├── MaintainabilityReviewer.js # Code quality
│   │   ├── StyleReviewer.js       # Style enforcement
│   │   └── AIReviewer.js          # AI-powered reviews
│   ├── utils/
│   │   ├── GitHubService.js       # GitHub API integration
│   │   ├── Logger.js              # Logging utility
│   │   └── ConfigLoader.js        # Configuration loader
│   └── index.js                   # Entry point
├── docs/
│   └── SETUP.md                   # Detailed setup guide
├── package.json
├── .env.example
└── README.md
```

## 🔍 Review Categories

### Security Reviews

Detects:
- Hardcoded credentials (passwords, API keys, tokens)
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure dependencies
- Sensitive data exposure in logs

### Performance Reviews

Identifies:
- Inefficient loops and nested iterations
- Memory leaks (event listeners, intervals)
- Blocking operations (synchronous I/O)
- Unnecessary computations
- DOM queries in loops

### Maintainability Reviews

Checks for:
- Long functions (>50 lines)
- Complex conditionals
- Magic numbers
- Poor naming conventions
- Missing error handling
- Code duplication

### Style Reviews

Enforces:
- Consistent indentation
- Naming conventions (camelCase, PascalCase)
- Import organization
- Comment quality
- Line length limits

## ⚙️ Configuration

### Review Settings

```yaml
review_settings:
  enabled_checks:
    - security
    - performance
    - maintainability
    - style
  min_severity_to_comment: medium  # critical, high, medium, low
  auto_approve_on_success: false
  request_changes_on_critical: true
```

### Security Configuration

```yaml
security:
  enabled: true
  checks:
    - hardcoded_credentials
    - sql_injection
    - xss_vulnerabilities
  patterns:
    credentials:
      - 'password\s*=\s*["\'].*["\']'
      - 'api[_-]?key\s*=\s*["\'].*["\']'
```

### Performance Thresholds

```yaml
performance:
  thresholds:
    max_function_lines: 100
    max_file_lines: 500
    max_complexity: 15
    max_nested_loops: 3
```

### File Exclusions

```yaml
exclusions:
  paths:
    - 'node_modules/**'
    - 'dist/**'
    - 'build/**'
  file_patterns:
    - '*.lock'
    - '*.log'
    - '*.md'
```

## 🤖 AI-Powered Reviews

Enable AI reviews by setting your OpenAI API key:

```yaml
ai_review:
  enabled: true
  model: 'gpt-4'
  max_tokens: 4000
  temperature: 0.3
```

The AI reviewer provides:
- Context-aware suggestions
- Best practice recommendations
- Security vulnerability detection
- Code optimization ideas

## 🏢 Enterprise Integration

### GitHub Enterprise

1. Create a GitHub App or use a Personal Access Token with these permissions:
   - `pull_requests: write`
   - `contents: read`
   - `issues: write`

2. Add the token as a repository secret: `GITHUB_TOKEN`

3. The workflow will automatically run on PR events

### CI/CD Pipeline Integration

#### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Code Review') {
            steps {
                sh '''
                    cd pr-code-reviewer
                    npm ci
                    npm start
                '''
            }
        }
    }
}
```

#### GitLab CI

```yaml
code_review:
  stage: review
  script:
    - cd pr-code-reviewer
    - npm ci
    - npm start
  only:
    - merge_requests
```

#### Azure DevOps

```yaml
- task: Npm@1
  inputs:
    command: 'custom'
    workingDir: 'pr-code-reviewer'
    customCommand: 'ci'
- script: npm start
  workingDirectory: pr-code-reviewer
  displayName: 'Run Code Review'
```

## 📊 Review Output

The system provides:

1. **Inline Comments**: Posted directly on the changed lines
2. **Review Summary**: Overall assessment with issue counts
3. **Labels**: Automatically added based on findings
4. **Review Status**: Approve, Comment, or Request Changes

Example output:

```markdown
## 🤖 Automated Code Review

### Summary

**Total Issues:** 5

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 2 |
| 🟡 Medium | 1 |
| 🟢 Low | 1 |

### 🔴 Critical Issues

**src/auth.js**
- Line 15: Hardcoded API key detected

**Files Reviewed:** 8
**Lines Analyzed:** 342
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## 🔒 Security Considerations

- Store sensitive tokens in GitHub Secrets or environment variables
- Never commit `.env` files
- Use least-privilege access tokens
- Regularly update dependencies
- Review AI-generated suggestions before applying

## 📝 Customization

### Adding Custom Reviewers

Create a new reviewer in `src/reviewers/`:

```javascript
export class CustomReviewer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async review(filename, content, extension) {
    const issues = [];
    // Your custom review logic
    return issues;
  }
}
```

Register it in `CodeReviewer.js`:

```javascript
import { CustomReviewer } from './CustomReviewer.js';

this.reviewers.custom = new CustomReviewer(config.custom, logger);
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation in `docs/`
- Review configuration examples

## 🔄 Updates

To update to the latest version:

```bash
cd pr-code-reviewer
npm update
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)

---

**Built with ❤️ for better code quality**