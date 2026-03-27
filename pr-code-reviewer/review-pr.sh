#!/bin/bash

# PR Code Reviewer - Manual Execution Script
# Usage: ./review-pr.sh <PR_NUMBER>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./review-pr.sh <PR_NUMBER>"
    echo "Example: ./review-pr.sh 1"
    exit 1
fi

PR_NUMBER=$1
REPO_OWNER="catchmeinheaven-ui"
REPO_NAME="sampleRepo"

echo "=========================================="
echo "PR Code Reviewer - Manual Execution"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "Alternative: Set environment variables manually:"
    echo "  export PR_NUMBER=$PR_NUMBER"
    echo "  export REPO_OWNER=$REPO_OWNER"
    echo "  export REPO_NAME=$REPO_NAME"
    echo "  export BASE_REF=main"
    echo "  export HEAD_REF=your-branch"
    echo "  export BASE_SHA=\$(git rev-parse main)"
    echo "  export HEAD_SHA=\$(git rev-parse your-branch)"
    echo "  npm start"
    exit 1
fi

# Check if logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "Error: Not logged in to GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "Fetching PR #$PR_NUMBER details..."

# Get PR info
PR_INFO=$(gh pr view $PR_NUMBER --json baseRefName,headRefName,baseRefOid,headRefOid,title 2>&1)

if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch PR details"
    echo "$PR_INFO"
    exit 1
fi

BASE_REF=$(echo $PR_INFO | jq -r '.baseRefName')
HEAD_REF=$(echo $PR_INFO | jq -r '.headRefName')
BASE_SHA=$(echo $PR_INFO | jq -r '.baseRefOid')
HEAD_SHA=$(echo $PR_INFO | jq -r '.headRefOid')
PR_TITLE=$(echo $PR_INFO | jq -r '.title')

echo ""
echo "PR Details:"
echo "  Title: $PR_TITLE"
echo "  Number: #$PR_NUMBER"
echo "  Base: $BASE_REF ($BASE_SHA)"
echo "  Head: $HEAD_REF ($HEAD_SHA)"
echo ""
echo "Running code review..."
echo "=========================================="
echo ""

# Export variables
export PR_NUMBER
export REPO_OWNER
export REPO_NAME
export BASE_REF
export HEAD_REF
export BASE_SHA
export HEAD_SHA

# Run the review
npm start

EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Review completed successfully!"
    echo "Check your PR for review comments: https://github.com/$REPO_OWNER/$REPO_NAME/pull/$PR_NUMBER"
else
    echo "❌ Review failed with exit code: $EXIT_CODE"
    echo "Check the logs above for errors"
fi
echo "=========================================="

exit $EXIT_CODE

# Made with Bob
