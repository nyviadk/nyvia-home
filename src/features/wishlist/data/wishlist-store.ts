import { createCollectionStore } from '@/lib/db/collection-store';
import type { Wish } from '../types';
import { subscribeWishes } from './wishlist.repository';

/** Live ønsker (ordnet på `order`; favoritter løftes øverst i skærm-laget). */
export const useWishlistStore = createCollectionStore<Wish>('wishlist', subscribeWishes);
