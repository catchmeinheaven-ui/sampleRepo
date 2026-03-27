# Troubleshooting Guide - PR Code Reviewer

## Common Setup Issues

### Issue 1: Workflow Not Triggering (Most Common)

**Symptom**: Created a PR but no automated review appears

**Root Cause**: The `pr-code-reviewer` directory is not in the correct location

**Solution**:

The `pr-code-reviewer` directory must be **inside** your repository, not alongside it.

**Incorrect Structure** ❌:
```
/your-projects/
├── sampleRepo/           # Your GitHub repository
│   ├── src/
│   ├── README.md
│   └── .git/
└── pr-code-reviewer/     # ❌ WRONG LOCATION
    ├── .github/
    └── src/
```

**Correct Structure** ✅:
```
/your-projects/
└── sampleRepo/           # Your GitHub repository
    ├── src/
    ├── README.md
    ├── .git/
    └── pr-code-reviewer/  # ✅ CORRECT LOCATION
        ├── .github/
        └── src/
```

**Fix Steps**:
```bash
# Navigate to your repository
cd sampleRepo

# Move pr-code-reviewer into your repository
mv ../pr-code-reviewer ./

# Commit and push the workflow
git add pr-code-reviewer/
git commit -m "Add PR code reviewer"
git push origin main
```

### Issue 2: GitHub Actions Not Enabled

**Check**: Go to your repository → Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected
- Ensure Actions are enabled for your repository

### Issue 3: Workflow File Not in Correct Location

The workflow file must be at: `sampleRepo/.github/workflows/pr-review.yml`

**Fix**:
```bash
cd sampleRepo

# Create .github/workflows directory if it doesn't exist
mkdir -p .github/workflows

# Copy the workflow file
cp pr-code-reviewer/.github/workflows/pr-review.yml .github/workflows/

# Commit and push
git add .github/workflows/pr-review.yml
git commit -m "Add PR review workflow"
git push origin main
```

### Issue 4: GitHub Token Issues

**For Personal Access Token**:
1. Token must have `repo` scope
2. Token must be added as repository secret named `GITHUB_TOKEN`
3. Go to Repository → Settings → Secrets and variables → Actions
4. Add `GITHUB_TOKEN` with your token value

**For GitHub App**:
1. App must be installed on your repository
2. App needs these permissions:
   - Contents: Read
   - Pull requests: Read & Write
   - Issues: Read & Write
3. Generate private key and add as `GITHUB_APP_PRIVATE_KEY` secret
4. Add App ID as `GITHUB_APP_ID` secret

### Issue 5: Workflow Permissions

Add this to your workflow file if you get permission errors:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

## Step-by-Step Fix for Your Setup

Based on your description, here's exactly what you need to do:

### Step 1: Move Files to Correct Location

```bash
# Navigate to your sampleRepo directory
cd sampleRepo

# Move pr-code-reviewer into your repository
mv ../pr-code-reviewer ./

# Verify the structure
ls -la
# You should see pr-code-reviewer/ directory here
```

### Step 2: Set Up GitHub Actions Workflow

```bash
# Create .github/workflows directory
mkdir -p .github/workflows

# Copy the workflow file to the correct location
cp pr-code-reviewer/.github/workflows/pr-review.yml .github/workflows/

# Verify the file is in the right place
ls -la .github/workflows/
# You should see pr-review.yml
```

### Step 3: Configure Secrets

1. Go to `https://github.com/ankitson/sampleRepo/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `GITHUB_TOKEN`
4. Value: Your GitHub personal access token
5. Click "Add secret"

### Step 4: Commit and Push

```bash
# Add all files
git add .

# Commit
git commit -m "Add PR code reviewer system"

# Push to main branch
git push origin main
```

### Step 5: Test with a New PR

```bash
# Create a new branch
git checkout -b test-pr-review

# Make a simple change (add a file with some code)
echo 'const password = "hardcoded123";' > test.js

# Commit and push
git add test.js
git commit -m "Add test file with security issue"
git push origin test-pr-review
```

Then create a PR from `test-pr-review` to `main` on GitHub.

## Verification Steps

### 1. Check Workflow File Location
```bash
# From your sampleRepo directory
ls -la .github/workflows/pr-review.yml
# Should show the file exists
```

### 2. Check Actions Tab
- Go to `https://github.com/ankitson/sampleRepo/actions`
- You should see workflows listed
- When you create a PR, a new workflow run should appear

### 3. Check Repository Structure
```bash
# Your repository should look like this:
sampleRepo/
├── .github/
│   └── workflows/
│       └── pr-review.yml
├── pr-code-reviewer/
│   ├── src/
│   ├── package.json
│   └── ...
├── your-existing-files...
└── .git/
```

## Debug Commands

### Check if workflow is valid:
```bash
# Install GitHub CLI if you haven't
gh workflow list
gh workflow view pr-review.yml
```

### Check workflow runs:
```bash
gh run list
gh run view [run-id] --log
```

### Manual test (from pr-code-reviewer directory):
```bash
cd pr-code-reviewer

# Set environment variables manually
export GITHUB_TOKEN=your_token
export PR_NUMBER=1
export REPO_OWNER=ankitson
export REPO_NAME=sampleRepo
export BASE_REF=main
export HEAD_REF=test-branch
export BASE_SHA=main_commit_sha
export HEAD_SHA=branch_commit_sha

# Run manually
npm start
```

## Still Not Working?

If it's still not working after following these steps:

1. **Check the Actions tab** in your GitHub repository
2. **Look for error messages** in the workflow runs
3. **Verify the workflow file syntax** using GitHub's workflow validator
4. **Check repository permissions** - ensure Actions are enabled
5. **Try creating a minimal test PR** with obvious issues (like the hardcoded password example above)

## Quick Test File

Create this file to test if the reviewer detects issues:

```javascript
// test-security.js
const apiKey = "sk-1234567890abcdef"; // Should trigger security warning
const password = "admin123";          // Should trigger security warning

function inefficientLoop() {
  for (let i = 0; i < array.length; i++) { // Should trigger performance warning
    for (let j = 0; j < array.length; j++) { // Nested loop warning
      console.log(password); // Sensitive data in logs warning
    }
  }
}
```

If the system is working, this file should generate multiple review comments.