# Quick Start Guide - PR Code Reviewer

Get up and running with the PR Code Reviewer in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- GitHub repository access
- GitHub Personal Access Token

## Step 1: Installation (2 minutes)

```bash
# Navigate to your repository
cd /path/to/your/repository

# Copy the pr-code-reviewer directory
cp -r pr-code-reviewer /path/to/your/repo/

# Install dependencies
cd pr-code-reviewer
npm install
```

## Step 2: Configuration (2 minutes)

### Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Add your GitHub token:
```bash
GITHUB_TOKEN=ghp_your_token_here
```

### Get a GitHub Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `write:discussion`
4. Copy the token

## Step 3: Test (1 minute)

Create a test PR and watch the magic happen!

The workflow will automatically:
- ✅ Analyze your code changes
- ✅ Post inline comments on issues
- ✅ Create a review summary
- ✅ Add appropriate labels

## What Gets Reviewed?

### 🔒 Security
- Hardcoded credentials
- SQL injection risks
- XSS vulnerabilities
- Insecure dependencies

### ⚡ Performance
- Inefficient loops
- Memory leaks
- Blocking operations
- Unnecessary computations

### 🔧 Maintainability
- Long functions
- Code duplication
- Complex conditionals
- Poor naming

### 🎨 Style
- Inconsistent formatting
- Naming conventions
- Import organization
- Comment quality

## Example Output

```markdown
## 🤖 Automated Code Review

### Summary
**Total Issues:** 3

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟡 Medium | 2 |

### 🔴 Critical Issues
**src/auth.js**
- Line 15: Hardcoded API key detected
```

## Customization

Edit `src/config/review-config.yml` to:
- Enable/disable specific checks
- Adjust severity thresholds
- Add custom patterns
- Configure exclusions

## Optional: AI-Powered Reviews

Add OpenAI API key for intelligent suggestions:

```bash
# In .env file
OPENAI_API_KEY=sk-your_key_here
```

Enable in config:
```yaml
ai_review:
  enabled: true
  model: 'gpt-4'
```

## Troubleshooting

### Issue: Workflow not running
**Solution**: Check that `.github/workflows/pr-review.yml` exists and Actions are enabled

### Issue: Authentication error
**Solution**: Verify your GitHub token has correct permissions

### Issue: Too many comments
**Solution**: Increase `min_severity_to_comment` to `high` in config

## Next Steps

1. ✅ Review the [full documentation](README.md)
2. ✅ Customize review rules in `src/config/review-config.yml`
3. ✅ Set up [CI/CD integration](docs/SETUP.md#cicd-integration)
4. ✅ Train your team on interpreting results

## Support

- 📖 [Full Documentation](README.md)
- 🔧 [Setup Guide](docs/SETUP.md)
- 🏗️ [Architecture](docs/ARCHITECTURE.md)

---

**Ready to improve your code quality? Create a PR and see it in action!** 🚀