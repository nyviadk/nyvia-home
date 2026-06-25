/**
 * Firebase web-config læst fra EXPO_PUBLIC_*-miljøvariabler (.env).
 * Disse værdier er ikke hemmeligheder (de ligger i klient-bundtet og beskyttes
 * af Firestore/Storage security rules), men holdes i env for nem udskiftning.
 *
 * Bruges KUN af web-grenen (JS SDK). På native læses konfigurationen fra
 * google-services.json via @react-native-firebase.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} as const;

/** Kaster hvis web-config mangler (typisk glemt EXPO_PUBLIC_*-prefix i .env). */
export function assertFirebaseConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Manglende Firebase web-config: ${missing.join(', ')}. ` +
        'Tjek at .env bruger EXPO_PUBLIC_FIREBASE_*-prefix (ikke NEXT_PUBLIC_).'
    );
  }
}
