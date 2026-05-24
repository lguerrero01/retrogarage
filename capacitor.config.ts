import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.retrogarage.app',
  appName: 'Retro Garage',
  webDir: 'dist/angular-restaurant-app',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      launchAutoHide: true,
      launchShowDuration: 1500
    }
  }
};

export default config;
