import type { ReactNode } from 'react';

import { useKeyboardOverlap } from '@/lib/keyboard/web-keyboard-overlap';
import { ScrollView } from '@/tw';

/**
 * Web scroll-container. Antog før at web ikke havde et tastatur der dækkede felterne — det holder
 * ikke på mobil-web: react-native-keyboard-controller er native-only (pakken har `.native`-bindings
 * og ingen web-implementering), så ingen flytter det fokuserede felt fri af tastaturet.
 *
 * Det gør ondt netop her, fordi Expos web-skabelon sætter `html,body{height:100%}` og
 * `body{overflow:hidden}` — SIDEN kan ikke scrolle, alt scroll sker inde i denne ScrollView. Er
 * indholdet ikke højere end skærmen, er der bogstaveligt talt ikke noget at scrolle til, og et felt
 * i bunden (fx kommentarfeltet på den delte ønskeliste) bliver liggende under tastaturet.
 *
 * Derfor lægges præcis den plads til i bunden, som tastaturet dækker — ikke en fast klump padding,
 * for så ville der stå et stort tomt felt resten af tiden.
 */
export function KeyboardAwareScroll({ children }: { children: ReactNode }) {
  const overlap = useKeyboardOverlap();

  return (
    <ScrollView
      className="flex-1 scrollbar-gutter-stable"
      contentContainerClassName="grow"
      contentContainerStyle={{ paddingBottom: overlap }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
