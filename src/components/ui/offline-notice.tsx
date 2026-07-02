import { useEffect, useState } from 'react';

import { AppText } from '@/components/ui/text';

/**
 * "Offline – viser gemte data" vises KUN hvis `fromCache` har været true i mere end 1,5 sek.
 * Firestore leverer cache-først (fromCache=true) også når man er online, så et kort glimt er
 * helt normalt — vi venter, så beskeden kun dukker op ved reel offline, ikke bare cache-først.
 */
export function OfflineNotice({ fromCache }: { fromCache: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!fromCache) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(id);
  }, [fromCache]);

  if (!show) return null;
  return <AppText variant="muted">Offline – viser gemte data</AppText>;
}
