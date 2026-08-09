import { createPendingDeletes } from '@/lib/db/pending-deletes';

/**
 * Fortryd-vinduer for gæste-kollektionerne på den delte ønskeliste.
 *
 * Selve ønskerne har deres eget vindue inde i `useWishlistStore.pending` (den er en
 * collection-store). Disse tre hentes derimod med `useLiveCollection`, fordi ejerens uid
 * kommer fra URL'en og gæsten ikke er logget ind — derfor står de her.
 *
 * Bemærk: fortryd er LOKAL for den der sletter — andre med siden åben ser først ændringen
 * når skrivningen sker. Det er med vilje: alternativet ville være en synlig ændring der
 * forsvinder igen.
 */
export const pendingExtraDeletes = createPendingDeletes();
export const pendingContributionDeletes = createPendingDeletes();
export const pendingCommentDeletes = createPendingDeletes();
