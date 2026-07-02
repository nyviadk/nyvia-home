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
export default ({ config }: ConfigContext): ExpoConfig => {
  // APP_VARIANT sættes pr. EAS build-profil (eas.json). Kun PREVIEW får sit eget package
  // name/bundleId + navn + scheme, så preview kan ligge side om side med prod på telefonen.
  // Dev deler package med prod (ingen ekstra Firebase-opsætning). Slug/EAS-id er uændrede.
  const isPreview = process.env.APP_VARIANT === 'preview';
  const suffix = isPreview ? '.preview' : '';
  const label = isPreview ? ' (Preview)' : '';
  const schemeSuffix = isPreview ? 'preview' : '';

  return {
  ...config,
  name: `nyvia-home${label}`,
  slug: 'nyvia-home',
  owner: 'nyvia.dk',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: `nyviahome${schemeSuffix}`,
  userInterfaceStyle: 'automatic',
  // EAS Update (OTA). appVersion-policy: et update rammer builds med samme version
  // (1.0.0). Ved native-ændringer → bump version + ny build.
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/32217862-113c-4d9c-ad99-e9108ce99c4b',
  },
  ios: {
    icon: './assets/images/icon.png',
    bundleIdentifier: `nyvia.home${suffix}`,
  },
  android: {
    package: `nyvia.home${suffix}`,
    // Lokalt: filen i projektroden. På EAS: en "file"-env-variabel (GOOGLE_SERVICES_JSON),
    // da google-services.json er git-ignoreret og derfor ikke følger med til cloud-build.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#2f7d6b',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    // SPA frem for statisk SSG: appen er client-only (Firebase i browseren),
    // så vi vil ikke server-rendere ruterne i Node.
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2f7d6b',
        android: { image: './assets/images/splash-icon.png', imageWidth: 120 },
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
  extra: {
    ...config.extra,
    eas: {
      projectId: '32217862-113c-4d9c-ad99-e9108ce99c4b',
    },
  },
  };
};
