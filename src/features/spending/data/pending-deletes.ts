import { useTransactionsStore } from './transactions-store';

/**
 * Transaktionernes fortryd-vindue bor i selve storen (`useTransactionsStore.pending`).
 * Denne genvej findes, fordi seks skærme læser den samme liste — ét navn at søge efter.
 */
export const pendingTransactionDeletes = useTransactionsStore.pending;
export const useVisibleTransactions = useTransactionsStore.useVisibleItems;
