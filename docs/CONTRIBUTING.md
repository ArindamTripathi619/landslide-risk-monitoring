# 🤝 Contributing Guide

Thank you for contributing to the Landslide Risk Monitoring System! This guide walks you through the complete workflow — from forking the repo to getting your PR merged.

---

## Prerequisites

Make sure you have these installed:

```bash
# Check Node.js
node --version    # Need v20+

# Check Python
python3 --version  # Need 3.10+

# Check gh CLI
gh --version       # GitHub CLI

# Check git
git --version
```

Install the GitHub CLI if you don't have it:
```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Or download from: https://cli.github.com/
```

Authenticate with GitHub:
```bash
gh auth login
# Choose: GitHub.com → HTTPS → Login with browser
```

---

## Step-by-Step Workflow

### Step 1: Fork the Repository

```bash
# Fork via gh CLI (creates a copy under YOUR GitHub account)
gh repo fork ArindamTripathi619/landslide-risk-monitoring --clone=false
```

Or fork manually:
1. Go to https://github.com/ArindamTripathi619/landslide-risk-monitoring
2. Click the **"Fork"** button (top right)
3. Select your GitHub account

### Step 2: Clone Your Fork

```bash
# Clone YOUR fork (not the original)
git clone https://github.com/YOUR_USERNAME/landslide-risk-monitoring.git

# Navigate into the project
cd landslide-risk-monitoring

# Add the original repo as "upstream" (to stay updated)
git remote add upstream https://github.com/ArindamTripathi619/landslide-risk-monitoring.git

# Verify remotes
git remote -v
# origin    https://github.com/YOUR_USERNAME/landslide-risk-monitoring.git (fetch)
# origin    https://github.com/YOUR_USERNAME/landslide-risk-monitoring.git (push)
# upstream  https://github.com/ArindamTripathi619/landslide-risk-monitoring.git (fetch)
# upstream  https://github.com/ArindamTripathi619/landslide-risk-monitoring.git (push)
```

### Step 3: Set Up Your Dev Environment

```bash
# Create a feature branch (always branch off main!)
git checkout -b feat/your-feature-name

# Examples:
# git checkout -b feat/add-sms-alerts
# git checkout -b fix/resolve-null-pointer
# git checkout -b docs/update-readme
# git checkout -b feat/mobile-camera-integration

# Install backend dependencies
cd backend && npm install && cd ..

# Set up ML service
cd ml-service
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
cd frontend/admin-dashboard && npm install && cd ../..

# Copy env file
cp backend/.env.example backend/.env
```

### Step 4: Make Your Changes

```bash
# Work on your feature/fix
# Edit files, add features, fix bugs...

# Stage your changes
git add .

# Or stage specific files
git add backend/routes/alerts.js backend/models/Alert.js

# Check what's staged
git status
```

### Step 5: Commit Your Changes

```bash
# Commit with a clear, descriptive message
git commit -m "feat: add SMS alert delivery via Twilio

- Add Twilio client configuration
- Implement sendSMS() utility function
- Integrate SMS into alert broadcast flow
- Add TWILIO_SID and TWILIO_TOKEN to .env.example
"

# Commit message conventions:
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation changes
# style:    Formatting, no code change
# refactor: Code restructuring, no feature change
# test:     Adding tests
# chore:    Build, config, tooling changes
```

### Step 6: Push to Your Fork

```bash
# Push your feature branch to YOUR fork
git push origin feat/your-feature-name
```

### Step 7: Create a Pull Request

```bash
# Method 1: Using gh CLI (recommended)
gh pr create \
  --base main \
  --head YOUR_USERNAME:feat/your-feature-name \
  --title "feat: Add SMS alert delivery via Twilio" \
  --body "## What does this PR do?
- Adds Twilio integration for SMS alerts
- Sends SMS to villagers when critical alerts are issued

## How to test
1. Set TWILIO_SID and TWILIO_TOKEN in .env
2. Issue a critical alert from the dashboard
3. Verify SMS is received on registered phone numbers

## Screenshots
(attach if UI change)"

# Method 2: Using gh with interactive prompts
gh pr create

# Method 3: Via browser
gh pr create --web
```

### Step 8: Respond to Review Feedback

```bash
# Make requested changes
# ...edit files...

# Stage and commit the fixes
git add .
git commit -m "fix: address review — add phone number validation"

# Push (same branch, PR updates automatically)
git push origin feat/your-feature-name
```

### Step 9: Get Your PR Merged

Once approved, the maintainer (ArindamTripathi619) will merge your PR. After merge:

```bash
# Switch back to main
git checkout main

# Pull latest changes (includes your merged PR!)
git pull upstream main

# Delete your feature branch (local)
git branch -d feat/your-feature-name

# Delete your feature branch (remote)
git push origin --delete feat/your-feature-name
```

---

## Quick Reference — Full Flow in One Block

```bash
# 1. Fork & clone
gh repo fork ArindamTripathi619/landslide-risk-monitoring --clone=false
git clone https://github.com/YOUR_USERNAME/landslide-risk-monitoring.git
cd landslide-risk-monitoring
git remote add upstream https://github.com/ArindamTripathi619/landslide-risk-monitoring.git

# 2. Branch
git checkout -b feat/my-feature

# 3. Make changes, test locally
# ...

# 4. Commit
git add .
git commit -m "feat: my feature description"

# 5. Push
git push origin feat/my-feature

# 6. Create PR
gh pr create --base main --title "feat: my feature" --body "Description here"

# 7. After merge, cleanup
git checkout main
git pull upstream main
git branch -d feat/my-feature
git push origin --delete feat/my-feature
```

---

## Useful gh CLI Commands

```bash
# List open PRs
gh pr list

# View a specific PR
gh pr view 12

# Check out a PR locally to test it
gh pr checkout 12

# Add comments to a PR
gh pr comment 12 --body "Looks good! Just one small fix needed."

# Merge a PR (maintainer only)
gh pr merge 12 --squash

# View PR diff
gh pr diff 12

# View PR checks/status
gh pr checks 12
```

---

## Syncing Your Fork with Upstream

If the main repo has new changes while you're working:

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream into your local main
git checkout main
git merge upstream/main

# Push updated main to your fork
git push origin main

# Rebase your feature branch on top of updated main
git checkout feat/my-feature
git rebase main

# Force push (only your feature branch!)
git push origin feat/my-feature --force-with-lease
```

---

## What Makes a Good PR?

### DO:
- ✅ Keep PRs small and focused (one feature or fix per PR)
- ✅ Write clear commit messages explaining WHY, not just what
- ✅ Test your changes locally before pushing
- ✅ Add screenshots if you changed any UI
- ✅ Update documentation if you changed APIs or added features
- ✅ Reference any related issues (e.g., "Closes #5")

### DON'T:
- ❌ Submit a PR with 50+ files changed (split it up)
- ❌ Include generated files (node_modules, venv, .pkl, .csv)
- ❌ Commit .env files with secrets
- ❌ Mix formatting changes with functional changes
- ❌ Submit a PR with console.log debugging left in

---

## Project Areas for Contribution

| Area | Difficulty | Good For |
|---|---|---|
| **SMS Alerts** (Twilio/MSG91) | Medium | Backend devs |
| **Cloud Deployment** (Docker + CI/CD) | Medium | DevOps |
| **Mobile Camera Integration** | Medium | React Native devs |
| **Offline Sync** | Hard | Mobile devs |
| **ML Model Enhancement** | Medium | ML/AI devs |
| **Road Network GIS** | Hard | GIS/Mapping devs |
| **Multi-Language UI** | Easy | Frontend devs |
| **Admin Dashboard Polish** | Easy | React devs |
| **API Tests** | Easy | Any backend dev |
| **Documentation** | Easy | Anyone |

---

## Reporting Issues

If you find a bug or have a feature request:

```bash
# Create an issue
gh issue create --title "Bug: Alert notifications not showing" --body "## Steps to reproduce
1. Login as district admin
2. Navigate to Alerts page
3. Click 'Issue Alert'
4. ...

## Expected behavior
Alert should appear in the list

## Actual behavior
500 error in console"

# Or use the web interface
gh issue create --web
```

---

## Questions?

If you're stuck or have questions:
1. Check the existing [Issues](https://github.com/ArindamTripathi619/landslide-risk-monitoring/issues)
2. Read the [PROJECT.md](./PROJECT.md) for architecture context
3. Read the [STATUS.md](./STATUS.md) to see what's already done
4. Open a new issue with the `question` label

---

Thank you for helping make disaster management better for North East India! 🙏
