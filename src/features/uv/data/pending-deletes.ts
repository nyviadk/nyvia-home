import { createPendingDeletes } from '@/lib/db/pending-deletes';

/**
 * UV-steder der er optimistisk fjernet, men endnu ikke skrevet. Stederne ligger i et
 * settings-dokument frem for en kollektion, men fortryd-vinduet fungerer ens: listen
 * filtreres visuelt, og `removePlace` kaldes først når vinduet udløber.
 */
export const pendingUvPlaceDeletes = createPendingDeletes();
