# Firebase Hosting Deployment Guide

This guide explains how to deploy the Card Capture frontend to Firebase Hosting.

## 🚀 Quick Start

### Prerequisites

1. **Firebase CLI**: Install the Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Account**: Ensure you have a Firebase account and project set up

3. **Environment Variables**: Set up your environment variables (see below)

### Manual Deployment

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Set up your Firebase project**:
   ```bash
   firebase init hosting
   ```
   Or manually update the `.firebaserc` file with your project ID.

3. **Configure environment variables** (see Environment Variables section)

4. **Deploy using the script**:
   ```bash
   ./deploy.sh
   ```

   Or manually:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## 🔄 Automated CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys your app when:

- **Production**: When code is pushed to the `main` branch
- **Preview**: When a pull request is created

### Setting up CI/CD

1. **GitHub Secrets**: Add these secrets to your GitHub repository settings:
   ```
   FIREBASE_SERVICE_ACCOUNT  # Firebase service account JSON
   FIREBASE_PROJECT_ID       # Your Firebase project ID
   VITE_SUPABASE_URL         # Your Supabase project URL
   VITE_SUPABASE_ANON_KEY    # Your Supabase anonymous key
   VITE_API_URL              # Your Cloud Run backend URL
   ```

2. **Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key and download the JSON file
   - Copy the entire JSON content and paste it as the `FIREBASE_SERVICE_ACCOUNT` secret

3. **Project ID**:
   - Find your project ID in the Firebase Console
   - Add it as the `FIREBASE_PROJECT_ID` secret

## 🔧 Environment Variables

The application requires the following environment variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_API_URL` | Backend API URL (Cloud Run) | `https://your-backend-service.run.app` |

### Setting Environment Variables

#### For Local Development:
Create a `.env.local` file in the project root:
```bash
cp env.example .env.local
# Edit .env.local with your actual values
```

#### For Production (Manual Deploy):
Create a `.env.production` file:
```bash
cp env.example .env.production
# Edit .env.production with your production values
```

#### For CI/CD:
Set environment variables as GitHub Secrets (as described above).

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── dist/                       # Build output (created by Vite)
├── src/                        # Source code
├── .firebaserc                 # Firebase project configuration
├── firebase.json               # Firebase hosting configuration
├── deploy.sh                   # Manual deployment script
└── env.example                 # Environment variables template
```

## 🌐 Firebase Configuration

### `firebase.json`
Configures Firebase Hosting with:
- **Public directory**: `dist` (Vite build output)
- **SPA rewrites**: All routes redirect to `index.html`
- **Caching headers**: Optimized caching for static assets

### `.firebaserc`
Contains your Firebase project ID. Update this file with your actual project ID:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

## 🔒 Security Features

- **HTTPS**: Firebase Hosting serves all content over HTTPS
- **Global CDN**: Content is served from Firebase's global CDN
- **Cache Headers**: Optimized caching for performance
- **Environment Isolation**: Separate environment variables for different stages

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check that all environment variables are set
   - Ensure all dependencies are installed: `npm install`
   - Run build locally first: `npm run build`

2. **Firebase CLI Issues**:
   - Make sure you're logged in: `firebase login`
   - Check project ID in `.firebaserc`
   - Verify Firebase project exists and hosting is enabled

3. **Environment Variables Not Working**:
   - Ensure variables start with `VITE_` prefix
   - Check the correct `.env` file is being used
   - Restart development server after changing env vars

4. **GitHub Actions Failing**:
   - Verify all GitHub Secrets are set correctly
   - Check that the Firebase service account has proper permissions
   - Ensure the project ID matches your actual Firebase project

### Logs and Debugging

- **Local build logs**: Check the terminal output from `npm run build`
- **Firebase deploy logs**: Use `firebase deploy --debug` for verbose output
- **GitHub Actions logs**: Check the Actions tab in your GitHub repository

## 📖 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions) 