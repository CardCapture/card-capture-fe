import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardcapture.app',
  appName: 'CardCapture',
  webDir: 'dist',
  server: {
    // For development, you can enable live reload:
    // url: 'http://YOUR_IP:5173',
    // cleartext: true,
  },
  plugins: {
    Camera: {
      // Request permissions on first use
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
