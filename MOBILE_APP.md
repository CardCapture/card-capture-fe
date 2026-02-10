# CardCapture Mobile App

This document describes how to build and run the CardCapture mobile app using Capacitor.

## Overview

The mobile app wraps the existing React web app with native capabilities:
- **Offline Support**: Capture cards without internet, sync when connected
- **Native Camera**: Uses device camera for better quality and performance
- **App Store Distribution**: Deploy to iOS App Store and Google Play Store

## Prerequisites

### For iOS Development
- macOS with Xcode 14+ installed
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development
- Android Studio (latest version)
- Android SDK (API 22+)
- Java 17+
- Google Play Developer Account ($25 one-time for Play Store distribution)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Web App
```bash
npm run build
```

### 3. Sync with Native Projects
```bash
npx cap sync
```

### 4. Open in IDE

**iOS (Xcode):**
```bash
npx cap open ios
```

**Android (Android Studio):**
```bash
npx cap open android
```

### 5. Run on Device/Simulator

**iOS:**
- Select your device/simulator in Xcode
- Press Cmd+R or click the Play button

**Android:**
- Select your device/emulator in Android Studio
- Press the Run button (green triangle)

## Development Workflow

### Live Reload (Development)

For faster development with hot reload on device:

1. Find your computer's IP address:
   ```bash
   # macOS
   ipconfig getifaddr en0
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_IP:5173',
     cleartext: true,
   }
   ```

3. Start the dev server:
   ```bash
   npm run dev -- --host
   ```

4. Run on device:
   ```bash
   npx cap run ios --livereload --external
   # or
   npx cap run android --livereload --external
   ```

### Standard Development

```bash
# Make changes to React code
npm run build        # Build the web app
npx cap sync         # Sync to native projects
npx cap open ios     # Open in Xcode and run
```

## Building for Production

### iOS

1. Open in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select "Any iOS Device (arm64)" as the build target

3. Product → Archive

4. Distribute App → App Store Connect

### Android

1. Open in Android Studio:
   ```bash
   npx cap open android
   ```

2. Build → Generate Signed Bundle / APK

3. Choose Android App Bundle (.aab) for Play Store

4. Upload to Google Play Console

## Project Structure

```
card-capture-fe/
├── capacitor.config.ts      # Capacitor configuration
├── ios/                     # iOS native project
│   └── App/
│       ├── App/
│       │   └── Info.plist   # iOS app configuration
│       └── Podfile          # iOS dependencies
├── android/                 # Android native project
│   └── app/
│       ├── src/main/
│       │   ├── AndroidManifest.xml
│       │   └── res/         # Android resources
│       └── build.gradle
└── src/
    ├── services/
    │   ├── offlineQueue.ts  # IndexedDB queue for offline cards
    │   └── syncService.ts   # Background sync service
    ├── hooks/
    │   ├── useNetworkStatus.ts  # Online/offline detection
    │   └── useOfflineQueue.ts   # React hook for queue state
    └── components/
        ├── OfflineBanner.tsx    # Offline status UI
        └── SyncStatusBadge.tsx  # Sync status indicator
```

## Offline Functionality

### How It Works

1. **When Online:**
   - Cards upload directly to the server
   - Normal processing flow

2. **When Offline:**
   - Cards are saved to IndexedDB (local database)
   - UI shows "Queued for sync" message
   - Badge shows pending count

3. **When Connection Returns:**
   - SyncService automatically detects network change
   - Queued cards upload one-by-one
   - Progress shown in UI
   - Successfully synced cards removed from queue

### Storage Limits

- IndexedDB storage: ~50MB-1GB (varies by device)
- Each card image: ~500KB-2MB after compression
- Practical limit: ~50-500 cards depending on device

## iOS Configuration

### Camera Permissions

Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>CardCapture needs camera access to scan student cards</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>CardCapture needs photo library access to select card images</string>
```

### App Icons

Replace the placeholder icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024

### Splash Screen

Update splash screen in `ios/App/App/Assets.xcassets/Splash.imageset/`

## Android Configuration

### Camera Permissions

Already configured in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### App Icons

Replace icons in `android/app/src/main/res/`:
- `mipmap-mdpi/` (48x48)
- `mipmap-hdpi/` (72x72)
- `mipmap-xhdpi/` (96x96)
- `mipmap-xxhdpi/` (144x144)
- `mipmap-xxxhdpi/` (192x192)

### Splash Screen

Configure in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#ffffff',
    androidScaleType: 'CENTER_CROP',
  },
}
```

## Troubleshooting

### iOS: "App Not Installed"
- Ensure your device is registered in Apple Developer Portal
- Check provisioning profile includes your device UDID

### Android: Camera Not Working
- Check camera permissions in Settings → Apps → CardCapture → Permissions
- Ensure `android.permission.CAMERA` is in AndroidManifest.xml

### Offline Queue Not Syncing
- Check browser console/Xcode logs for sync errors
- Verify auth token is valid (user may need to re-login)
- Check network status detection is working

### Build Errors After Changes
```bash
# Clean and rebuild
rm -rf ios/App/App/public
rm -rf android/app/src/main/assets/public
npm run build
npx cap sync
```

## Useful Commands

```bash
# Sync web build to native projects
npx cap sync

# Sync only (no plugin updates)
npx cap copy

# Update Capacitor plugins
npx cap update

# Open iOS project
npx cap open ios

# Open Android project
npx cap open android

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android

# Check doctor for issues
npx cap doctor
```

## App Store Submission Checklist

### iOS (App Store)
- [ ] App icons (all sizes)
- [ ] Splash screen
- [ ] Screenshots (6.5" and 5.5" iPhones, iPad)
- [ ] App description
- [ ] Privacy policy URL
- [ ] App Store Connect app record
- [ ] Provisioning profile (Distribution)
- [ ] Archive and upload via Xcode

### Android (Play Store)
- [ ] App icons
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Google Play Console app record
- [ ] Signed App Bundle (.aab)
- [ ] Upload via Play Console

## Environment Variables

The mobile app uses the same environment variables as the web app:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api.com
```

These are baked into the build at compile time.
