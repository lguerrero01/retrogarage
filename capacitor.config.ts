import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.retrogarage.app',
  appName: 'Retro Garage',
  webDir: 'dist/angular-restaurant-app',
  server: {
    androidScheme: 'https'
  }
};

export default config;
