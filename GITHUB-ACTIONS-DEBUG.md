# GitHub Actions Debugging Guide 🐛

If your GitHub Actions workflow isn't running when you push to `main`, follow this debugging checklist:

## 🔍 Quick Diagnostics

### 1. Check GitHub Actions Tab
- Go to your GitHub repository
- Click on the "Actions" tab
- Look for any workflow runs or error messages

### 2. Verify Repository Settings
- Go to Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected
- Check that Actions are enabled for your repository

### 3. Check Branch Protection Rules
- Go to Settings → Branches
- If you have branch protection on `main`, ensure "Require status checks to pass" doesn't block the workflow

## 🔧 Common Issues & Solutions

### Issue 1: Missing GitHub Secrets
**Symptoms**: Workflow runs but fails during deployment steps
**Solution**: Add these secrets in Settings → Secrets and Variables → Actions:

```
FIREBASE_SERVICE_ACCOUNT    # Your Firebase service account JSON
FIREBASE_PROJECT_ID         # Your Firebase project ID (gen-lang-client-0493571343)
VITE_SUPABASE_URL          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY     # Your Supabase anonymous key  
VITE_API_URL               # Your Cloud Run backend URL
```

### Issue 2: Workflow Doesn't Trigger
**Symptoms**: No workflow runs appear in Actions tab
**Possible Causes**:
- Files changed don't match the `paths` filter
- Pushing to wrong branch
- Workflow file has syntax errors

**Solutions**:
1. **Test Manual Trigger**: Go to Actions → Deploy to Firebase Hosting → Run workflow
2. **Check File Paths**: Ensure you're changing files in `src/`, `public/`, or other monitored paths
3. **Validate YAML**: Use [YAML Lint](https://www.yamllint.com/) to check `.github/workflows/deploy.yml`

### Issue 3: Firebase Service Account Issues
**Symptoms**: Build succeeds but deployment fails
**Solution**: 
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0493571343`
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Copy the entire JSON content
6. Paste as `FIREBASE_SERVICE_ACCOUNT` secret in GitHub

### Issue 4: Wrong Project ID
**Symptoms**: Firebase deployment fails with project not found
**Solution**: 
- Verify `FIREBASE_PROJECT_ID` secret matches: `gen-lang-client-0493571343`
- Check that Firebase Hosting is enabled for this project

## 🧪 Testing Steps

### Step 1: Manual Workflow Trigger
1. Go to GitHub → Actions → "Deploy to Firebase Hosting"
2. Click "Run workflow" → "Run workflow"
3. This will test if secrets and configuration are correct

### Step 2: Test with Simple Change
1. Make a small change to any file in `src/`
2. Commit and push to `main`:
   ```bash
   git add src/
   git commit -m "Test workflow trigger"
   git push origin main
   ```

### Step 3: Check Workflow Logs
1. Go to Actions tab after pushing
2. Click on the workflow run
3. Expand each step to see detailed logs
4. Look for error messages in red

## 🔍 Debugging Commands

Run these locally to verify your setup:

```bash
# Check current branch
git branch --show-current

# Check if workflow file exists
ls -la .github/workflows/

# Validate package.json scripts
npm run build

# Test Firebase CLI access
firebase projects:list

# Check environment variables
cat .env.production  # (if it exists)
```

## 📋 Workflow File Validation

Your `.github/workflows/deploy.yml` should:
- ✅ Trigger on pushes to `main` branch
- ✅ Have the correct paths filter
- ✅ Use the right secrets
- ✅ Include workflow_dispatch for manual triggers

## 🆘 Still Not Working?

If the workflow still doesn't run:

1. **Check Repository Permissions**: Ensure you have admin access to the repository
2. **Verify GitHub Actions Billing**: For private repos, check if you have Actions minutes available
3. **Create Test Workflow**: Create a simple workflow to verify Actions are working:

```yaml
# .github/workflows/test.yml
name: Test Workflow
on:
  push:
    branches: [ main ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Test
      run: echo "Workflow is working!"
```

## 📞 Getting Help

If none of these solutions work:
1. Check the detailed logs in the Actions tab
2. Look at the workflow file syntax
3. Ensure all secrets are correctly named and formatted
4. Try the manual trigger first to isolate the issue

## ✅ Success Indicators

When everything is working correctly, you should see:
- 🟢 Workflow appears in Actions tab after pushing to main
- 🟢 All steps complete successfully
- 🟢 Your app deploys to Firebase Hosting
- 🟢 You can access your app at your Firebase Hosting URL 