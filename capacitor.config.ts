import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labs.mobile',
  appName: 'Labs Supply Chain',
  webDir: 'dist/labs-mobile',
  server: {
    androidScheme: 'https',
  },
};

export default config;
