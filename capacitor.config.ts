import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tobiafo.musicdna',
  appName: 'Music DNA',
  webDir: 'dist',
  server: {
    // Hot-reload from Lovable sandbox during development
    // Comment this out for production builds
    url: 'https://6bce4129-8cf4-4ee0-bf55-a23dc0c57247.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'musicdna'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
