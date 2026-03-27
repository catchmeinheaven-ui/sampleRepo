# Webhook-Based Setup (When GitHub Actions Are Disabled)

If GitHub Actions are disabled by your enterprise administrators, you can use webhooks to trigger the code reviewer.

## Architecture Overview

```
GitHub PR Event → Webhook → Your Server → Code Reviewer → GitHub API → Post Comments
```

## Option 1: Manual Execution (Quickest for Testing)

### Setup

1. **Move pr-code-reviewer into your repository**:
```bash
cd sampleRepo
mv ../pr-code-reviewer ./
cd pr-code-reviewer
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
nano .env
```

Add:
```bash
GITHUB_TOKEN=your_github_token_here
```

3. **Run manually for each PR**:
```bash
# Get PR details from GitHub
export PR_NUMBER=1
export REPO_OWNER=ankitson
export REPO_NAME=sampleRepo
export BASE_REF=main
export HEAD_REF=feature-branch
export BASE_SHA=$(git rev-parse main)
export HEAD_SHA=$(git rev-parse feature-branch)

# Run the review
npm start
```

### Create a Helper Script

Create `review-pr.sh` in the pr-code-reviewer directory:

```bash
#!/bin/bash

# Usage: ./review-pr.sh <PR_NUMBER>

if [ -z "$1" ]; then
    echo "Usage: ./review-pr.sh <PR_NUMBER>"
    exit 1
fi

PR_NUMBER=$1
REPO_OWNER="ankitson"
REPO_NAME="sampleRepo"

# Fetch PR details using GitHub CLI
echo "Fetching PR #$PR_NUMBER details..."

# Get PR info
PR_INFO=$(gh pr view $PR_NUMBER --json baseRefName,headRefName,baseRefOid,headRefOid)

BASE_REF=$(echo $PR_INFO | jq -r '.baseRefName')
HEAD_REF=$(echo $PR_INFO | jq -r '.headRefName')
BASE_SHA=$(echo $PR_INFO | jq -r '.baseRefOid')
HEAD_SHA=$(echo $PR_INFO | jq -r '.headRefOid')

echo "Base: $BASE_REF ($BASE_SHA)"
echo "Head: $HEAD_REF ($HEAD_SHA)"
echo "Running code review..."

# Export variables and run
export PR_NUMBER
export REPO_OWNER
export REPO_NAME
export BASE_REF
export HEAD_REF
export BASE_SHA
export HEAD_SHA

npm start

echo "Review complete!"
```

Make it executable:
```bash
chmod +x review-pr.sh
```

Usage:
```bash
./review-pr.sh 1  # Review PR #1
```

## Option 2: Webhook Server (For Automation)

### Setup Express Webhook Server

Create `webhook-server.js` in pr-code-reviewer directory:

```javascript
import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-here';

app.use(express.json());

// Verify GitHub webhook signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    console.error('Invalid signature');
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`Received ${event} event`);

  // Handle pull request events
  if (event === 'pull_request') {
    const action = payload.action;
    
    // Trigger review on opened, synchronize, or reopened
    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      const pr = payload.pull_request;
      
      console.log(`Processing PR #${pr.number}: ${pr.title}`);
      
      // Set environment variables
      process.env.PR_NUMBER = pr.number.toString();
      process.env.REPO_OWNER = payload.repository.owner.login;
      process.env.REPO_NAME = payload.repository.name;
      process.env.BASE_REF = pr.base.ref;
      process.env.HEAD_REF = pr.head.ref;
      process.env.BASE_SHA = pr.base.sha;
      process.env.HEAD_SHA = pr.head.sha;

      // Run review asynchronously
      runReview().catch(err => {
        console.error('Review failed:', err);
      });

      res.status(200).send('Review triggered');
    } else {
      res.status(200).send('Event ignored');
    }
  } else {
    res.status(200).send('Event not handled');
  }
});

async function runReview() {
  try {
    console.log('Starting code review...');
    const { stdout, stderr } = await execAsync('npm start', {
      cwd: __dirname,
      env: process.env
    });
    
    console.log('Review output:', stdout);
    if (stderr) console.error('Review errors:', stderr);
    
    console.log('Review completed successfully');
  } catch (error) {
    console.error('Review execution failed:', error);
  }
}

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Webhook URL: http://your-server:${PORT}/webhook`);
});
```

### Update package.json

Add to scripts section:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "webhook": "node webhook-server.js"
  }
}
```

### Configure GitHub Webhook

1. Go to your repository settings: `https://github.com/ankitson/sampleRepo/settings/hooks`
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `http://your-server:3000/webhook`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret (same as in .env)
   - **Events**: Select "Pull requests"
4. Click "Add webhook"

### Deploy Webhook Server

**Option A: Run locally with ngrok (for testing)**:
```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Start webhook server
npm run webhook

# In another terminal, expose it
ngrok http 3000

# Use the ngrok URL in GitHub webhook settings
```

**Option B: Deploy to a server**:
```bash
# On your server
cd pr-code-reviewer
npm install
npm install -g pm2

# Start with pm2
pm2 start webhook-server.js --name pr-reviewer
pm2 save
pm2 startup
```

## Option 3: GitHub App with Webhooks

If you created a GitHub App, you can use it with webhooks:

1. **Configure GitHub App Webhook**:
   - Go to your GitHub App settings
   - Set Webhook URL: `http://your-server:3000/webhook`
   - Set Webhook secret
   - Enable webhook
   - Subscribe to "Pull request" events

2. **Update webhook-server.js** to handle GitHub App authentication:

```javascript
import { App } from '@octokit/app';

const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
});

// In webhook handler, get installation token
const installationId = payload.installation.id;
const octokit = await app.getInstallationOctokit(installationId);
process.env.GITHUB_TOKEN = octokit.auth.token;
```

## Option 4: CI/CD Integration (If Available)

If you have access to other CI/CD systems:

### Jenkins
```groovy
pipeline {
    agent any
    triggers {
        githubPullRequests(
            triggerMode: 'HEAVY_HOOKS',
            events: [Open(), Synchronize()]
        )
    }
    stages {
        stage('Code Review') {
            steps {
                sh '''
                    cd pr-code-reviewer
                    export PR_NUMBER=${ghprbPullId}
                    export REPO_OWNER=${ghprbTargetRepoOwner}
                    export REPO_NAME=${ghprbTargetRepoName}
                    export BASE_REF=${ghprbTargetBranch}
                    export HEAD_REF=${ghprbSourceBranch}
                    npm start
                '''
            }
        }
    }
}
```

### GitLab CI (if mirroring to GitLab)
```yaml
code_review:
  script:
    - cd pr-code-reviewer
    - npm ci
    - npm start
  only:
    - merge_requests
```

## Testing Your Setup

### Test Manual Execution

1. Create a test file with issues:
```bash
cd sampleRepo
git checkout -b test-review

cat > test-security.js << 'EOF'
const apiKey = "sk-1234567890";
const password = "admin123";

function badCode() {
  for (let i = 0; i < arr.length; i++) {
    console.log(password);
  }
}
EOF

git add test-security.js
git commit -m "Add test file"
git push origin test-review
```

2. Create PR on GitHub

3. Run review manually:
```bash
cd pr-code-reviewer
./review-pr.sh 1  # Replace 1 with your PR number
```

4. Check your PR for comments

### Test Webhook Server

1. Start the webhook server:
```bash
npm run webhook
```

2. Create or update a PR

3. Check server logs for webhook events

4. Verify comments appear on PR

## Troubleshooting

### Issue: "GitHub Actions disabled"
**Solution**: Use one of the webhook or manual options above

### Issue: Can't expose webhook publicly
**Solution**: Use ngrok for testing or deploy to a cloud server

### Issue: Webhook not receiving events
**Check**:
- Webhook URL is accessible from GitHub
- Webhook secret matches
- Events are configured correctly
- Check GitHub webhook delivery logs

### Issue: Review fails to post comments
**Check**:
- GitHub token has correct permissions
- Token is not expired
- Repository access is granted

## Recommended Approach for Your Situation

Since GitHub Actions are disabled, I recommend:

1. **For immediate testing**: Use **Option 1 (Manual Execution)** with the helper script
2. **For automation**: Set up **Option 2 (Webhook Server)** on a server you control
3. **For enterprise**: Work with your administrators to enable GitHub Actions or set up a dedicated CI/CD integration

The manual approach will work immediately and let you test the code reviewer functionality while you set up automation.