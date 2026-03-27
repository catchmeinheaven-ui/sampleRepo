# Publishing PR Code Reviewer to GitHub

This guide will help you publish the pr-code-reviewer to your GitHub repository: `https://github.com/catchmeinheaven-ui/sampleRepo.git`

## Step 1: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/catchmeinheaven-ui/sampleRepo.git
cd sampleRepo
```

## Step 2: Copy PR Code Reviewer

```bash
# Copy the pr-code-reviewer directory into your repository
cp -r /Users/ankit/bob/Complete\ Case/pr-code-reviewer ./

# Verify it's copied
ls -la pr-code-reviewer/
```

## Step 3: Set Up GitHub Workflow

```bash
# Create .github/workflows directory if it doesn't exist
mkdir -p .github/workflows

# Copy the workflow file
cp pr-code-reviewer/.github/workflows/pr-review.yml .github/workflows/

# Verify the workflow is in place
ls -la .github/workflows/
```

## Step 4: Configure Environment

```bash
cd pr-code-reviewer

# Copy environment template
cp .env.example .env

# Edit .env and add your GitHub token
# You can use nano, vim, or any text editor
nano .env
```

Add your GitHub token:
```bash
GITHUB_TOKEN=your_github_personal_access_token_here
```

## Step 5: Install Dependencies

```bash
# Install npm dependencies
npm install

# Make the review script executable
chmod +x review-pr.sh
```

## Step 6: Commit and Push to GitHub

```bash
# Go back to repository root
cd ..

# Add all files
git add .

# Commit
git commit -m "Add PR Code Reviewer system

- Automated code review with 5 specialized reviewers
- Security, Performance, Maintainability, Style, and AI reviews
- Manual execution script for when GitHub Actions are disabled
- Comprehensive documentation and configuration"

# Push to GitHub
git push origin main
```

## Step 7: Set Up GitHub Secrets

Since GitHub Actions are disabled, you'll use manual execution. But if Actions get enabled later:

1. Go to: `https://github.com/catchmeinheaven-ui/sampleRepo/settings/secrets/actions`
2. Click "New repository secret"
3. Add these secrets:
   - Name: `GITHUB_TOKEN`
   - Value: Your GitHub personal access token
   - (Optional) Name: `OPENAI_API_KEY` for AI reviews

## Step 8: Test the Setup

### Create a Test PR

```bash
# Create a test branch
git checkout -b test-code-review

# Create a test file with intentional issues
cat > test-security.js << 'EOF'
// Test file for code reviewer
const apiKey = "sk-1234567890abcdef";  // Hardcoded API key
const password = "admin123";            // Hardcoded password

function inefficientCode() {
  // Inefficient loop
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      console.log(password);  // Sensitive data in logs
    }
  }
}

// Magic number
const timeout = 5000;

// Poor naming
function x() {
  return 42;
}
EOF

# Commit and push
git add test-security.js
git commit -m "Add test file for code review"
git push origin test-code-review
```

### Create PR on GitHub

1. Go to: `https://github.com/catchmeinheaven-ui/sampleRepo`
2. Click "Pull requests" → "New pull request"
3. Select `test-code-review` → `main`
4. Click "Create pull request"
5. Note the PR number (e.g., #1)

### Run Manual Review

```bash
# Go to pr-code-reviewer directory
cd sampleRepo/pr-code-reviewer

# Run the review (replace 1 with your PR number)
./review-pr.sh 1
```

### Check Results

1. Go to your PR on GitHub
2. You should see:
   - Inline comments on the problematic lines
   - A review summary
   - Labels added to the PR

## Alternative: Quick Publish Script

Save this as `publish-to-github.sh` in your current directory:

```bash
#!/bin/bash

set -e

echo "=========================================="
echo "Publishing PR Code Reviewer to GitHub"
echo "=========================================="
echo ""

# Check if sampleRepo exists
if [ -d "sampleRepo" ]; then
    echo "✓ sampleRepo directory found"
    cd sampleRepo
else
    echo "Cloning repository..."
    git clone https://github.com/catchmeinheaven-ui/sampleRepo.git
    cd sampleRepo
fi

echo ""
echo "Copying pr-code-reviewer..."
cp -r ../pr-code-reviewer ./

echo "Setting up GitHub workflow..."
mkdir -p .github/workflows
cp pr-code-reviewer/.github/workflows/pr-review.yml .github/workflows/

echo "Installing dependencies..."
cd pr-code-reviewer
npm install
chmod +x review-pr.sh
cd ..

echo ""
echo "Committing changes..."
git add .
git commit -m "Add PR Code Reviewer system"

echo ""
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=========================================="
echo "✅ Successfully published to GitHub!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Set up your .env file in pr-code-reviewer/"
echo "2. Add your GITHUB_TOKEN"
echo "3. Create a test PR"
echo "4. Run: cd pr-code-reviewer && ./review-pr.sh <PR_NUMBER>"
echo ""
echo "Repository: https://github.com/catchmeinheaven-ui/sampleRepo"
echo "=========================================="
```

Make it executable and run:
```bash
chmod +x publish-to-github.sh
./publish-to-github.sh
```

## Troubleshooting

### Issue: Permission denied when pushing

**Solution**: Ensure you're authenticated with GitHub:
```bash
gh auth login
# or
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Issue: Repository already exists locally

**Solution**: Remove and re-clone:
```bash
rm -rf sampleRepo
git clone https://github.com/catchmeinheaven-ui/sampleRepo.git
```

### Issue: npm install fails

**Solution**: Ensure Node.js 18+ is installed:
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## What Gets Published

Your repository will contain:

```
sampleRepo/
├── .github/
│   └── workflows/
│       └── pr-review.yml          # GitHub Actions workflow (for when enabled)
├── pr-code-reviewer/
│   ├── .github/
│   │   └── workflows/
│   │       └── pr-review.yml
│   ├── docs/
│   │   ├── ARCHITECTURE.md
│   │   ├── SETUP.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── WEBHOOK-SETUP.md
│   ├── src/
│   │   ├── config/
│   │   │   └── review-config.yml
│   │   ├── reviewers/
│   │   │   ├── AIReviewer.js
│   │   │   ├── CodeReviewer.js
│   │   │   ├── MaintainabilityReviewer.js
│   │   │   ├── PerformanceReviewer.js
│   │   │   ├── SecurityReviewer.js
│   │   │   └── StyleReviewer.js
│   │   ├── utils/
│   │   │   ├── ConfigLoader.js
│   │   │   ├── GitHubService.js
│   │   │   └── Logger.js
│   │   └── index.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── QUICKSTART.md
│   ├── README.md
│   ├── review-pr.sh              # Manual execution script
│   └── PUBLISH-GUIDE.md          # This file
└── (your existing files)
```

## Success Checklist

- [ ] Repository cloned
- [ ] pr-code-reviewer copied to repository
- [ ] Workflow file in .github/workflows/
- [ ] Dependencies installed (npm install)
- [ ] .env file configured with GITHUB_TOKEN
- [ ] review-pr.sh is executable
- [ ] Changes committed and pushed to GitHub
- [ ] Test PR created
- [ ] Manual review executed successfully
- [ ] Review comments appear on PR

## Support

For issues or questions:
- Check [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
- Review [`docs/SETUP.md`](docs/SETUP.md)
- See [`README.md`](README.md) for full documentation

---

**Repository**: https://github.com/catchmeinheaven-ui/sampleRepo