import type { ReactNode } from 'react';

import { View } from '@/tw';
import { AppText } from './text';

export interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

/** Etiket + felt + fejlbesked. Feltet (fx <Input/>) gives som children. */
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View className="gap-1.5">
      <AppText variant="label">{label}</AppText>
      {children}
      {error ? <AppText className="text-red-500">{error}</AppText> : null}
    </View>
  );
}
