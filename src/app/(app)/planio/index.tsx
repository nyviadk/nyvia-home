import { PlanioScreen } from '@/features/planio/screens/planio-screen';
import { PlanioUnavailableScreen } from '@/features/planio/screens/planio-unavailable-screen';

/** My Planio er web-only. Native viser en "kun på web"-fallback (branch i komponenten frem for
 *  et .web/.native-split, så ruten kollapser til bare `/planio`). */
export default function PlanioRoute() {
  return process.env.EXPO_OS === 'web' ? <PlanioScreen /> : <PlanioUnavailableScreen />;
}
