import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Screen } from '@/components/ui/screen';
import { EditCustomLoanScreen } from '../custom/screens/edit-custom-loan-screen';
import { CustomLoanDetailScreen } from '../custom/screens/custom-loan-detail-screen';
import { useLoan } from '../hooks/use-loan';
import { isCustomLoan } from '../types';
import { EditLoanScreen } from './edit-loan-screen';
import { LoanDetailScreen } from './loan-detail-screen';

/**
 * Standard- og flytte-lån ligger i SAMME kollektion og deler rute, så typen kan først
 * afgøres når dokumentet er hentet.
 *
 * Forgreningen sker her ÉN gang og lånet sendes ned som prop. Før hentede både ruten og den
 * valgte skærm lånet hver for sig: på første frame (uden data) valgte ruten standard-skærmen,
 * som viste "Indlæser…", hvorefter et custom-lån rev træet ned og monterede den anden skærm,
 * der viste "Indlæser…" igen. Skærmene havde desuden hver sin `if (isCustomLoan) return null`
 * som aldrig kunne rammes.
 */
function useResolvedLoan(id: string) {
  const { loan, loading } = useLoan(id);
  if (loading && !loan) return { state: 'loading' as const };
  if (!loan) return { state: 'missing' as const };
  return { state: 'ready' as const, loan };
}

const NotFound = () => (
  <Screen>
    <EmptyState title="Lånet findes ikke" description="Det er muligvis blevet slettet." />
  </Screen>
);

export function LoanDetailRoute({ id }: { id: string }) {
  const resolved = useResolvedLoan(id);
  if (resolved.state === 'loading') return <LoadingScreen />;
  if (resolved.state === 'missing') return <NotFound />;
  return isCustomLoan(resolved.loan) ? (
    <CustomLoanDetailScreen loan={resolved.loan} />
  ) : (
    <LoanDetailScreen loan={resolved.loan} />
  );
}

export function EditLoanRoute({ id }: { id: string }) {
  const resolved = useResolvedLoan(id);
  if (resolved.state === 'loading') return <LoadingScreen />;
  if (resolved.state === 'missing') return <NotFound />;
  return isCustomLoan(resolved.loan) ? (
    <EditCustomLoanScreen loan={resolved.loan} />
  ) : (
    <EditLoanScreen loan={resolved.loan} />
  );
}
