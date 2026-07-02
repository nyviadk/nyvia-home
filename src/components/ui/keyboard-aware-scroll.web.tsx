import type { ReactNode } from 'react';

import { ScrollView } from '@/tw';

/** Web: intet software-tastatur der dækker felterne → almindelig ScrollView (uændret). */
export function KeyboardAwareScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 scrollbar-gutter-stable"
      contentContainerClassName="grow"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
