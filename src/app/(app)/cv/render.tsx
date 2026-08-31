import { useLocalSearchParams } from 'expo-router';

import { WebOnlyScreen } from '@/components/ui/web-only-screen';
import { CvRenderScreen } from '@/features/cv/screens/cv-render-screen';

/**
 * At LAVE CV'et er web-only: det bygges i en iframe og printes med browserens egen
 * print-til-PDF. Kataloget kan redigeres begge steder — det er dér man lige tilføjer et
 * punkt fra telefonen — men PDF'en laver man ikke fra sofaen.
 *
 * `?a=<id>` genåbner en gemt ansøgning fra arkivet.
 */
export default function CvRenderRoute() {
  const { a } = useLocalSearchParams<{ a?: string }>();
  return process.env.EXPO_OS === 'web' ? (
    <CvRenderScreen genaabn={a} />
  ) : (
    <WebOnlyScreen
      title="CV laves på web"
      description="PDF'en bygges i browseren og printes derfra. Kataloget kan du redigere her på telefonen."
    />
  );
}
