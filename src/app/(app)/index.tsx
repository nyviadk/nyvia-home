import { Redirect } from 'expo-router';

// Forsiden er nu "Hjem" (bolig-listen). Index sender bare videre dertil.
export default function Index() {
  return <Redirect href="/homes" />;
}
