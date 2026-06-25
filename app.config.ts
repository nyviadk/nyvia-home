import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Hele Expo-konfigurationen for NyviaHome (ingen app.json — bevidst).
 *
 * Hvorfor kun app.config.ts: VS Code's expo-manifest-linter validerer config-plugins
 * statisk ud fra app.json og kan ikke parse @react-native-firebase-pluginnets
 * require-kæde ("Unexpected token 'typeof'"). Det er ren editor-støj — Expo CLI
 * loader pluginnet fint (verificeret med `expo config --type introspect`, exit 0,
 * og RNFB v25 er langt forbi publicerings-regressionen i 23.8.0–.3). Ved at have
 * konfigurationen i TypeScript frem for JSON fjerner vi linterens falske positiv helt.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'nyvia-home',
  slug: 'nyvia-home',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'nyviahome',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: 'nyvia.home',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: { image: './assets/images/splash-icon.png', imageWidth: 76 },
      },
    ],
    'expo-secure-store',
    'expo-sharing',
    'expo-build-properties',
    '@react-native-firebase/app',
    [
      'expo-camera',
      {
        cameraPermission:
          'NyviaHome bruger kameraet til at tage billeder af målere, regninger og fejl/mangler.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'NyviaHome bruger dine billeder til at vedhæfte dokumentation (målere, kvitteringer, fejl/mangler).',
      },
    ],
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
