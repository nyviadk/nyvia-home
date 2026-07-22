/**
 * Centrale, className-styrede komponenter til NyviaHome.
 *
 * react-native-css leverer drop-in-komponenter der allerede er css-interop-wrappede
 * og typet som de ægte react-native-komponenter. `className` er globalt typet via
 * `react-native-css/types` (se nativewind-env.d.ts), så vi får fuld type-sikkerhed
 * uden manuelle wrappers eller `any`.
 */
import { forwardRef, type ComponentProps, type ComponentRef } from 'react';
import { useNativeVariable } from 'react-native-css';
import { Pressable as CssPressable } from 'react-native-css/components';

import { cn } from '@/lib/cn';

export {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native-css/components';

type PressableProps = ComponentProps<typeof CssPressable>;

/**
 * Pressable med indbygget tryk-feedback: falmer (opacity) mens den holdes nede via NativeWinds
 * `active:`-variant, som react-native-css håndterer korrekt på ALLE platforme (samme mekanisme
 * som `Button`) — så man på mobil (ingen hover) tydeligt kan se at knappen er ramt. Bevidst via
 * className og IKKE en `style`-funktion: react-native-css fletter className-styles + `style` til
 * et array, og et array med en funktion i er ugyldigt for RN Pressable → funktionen ville blive
 * droppet. Kan overstyres med egen `active:opacity-*`-klasse (sidste vinder via tailwind-merge).
 * Ref forwardes, så `<Link asChild>` fortsat virker.
 */
export const Pressable = forwardRef<ComponentRef<typeof CssPressable>, PressableProps>(
  function Pressable({ className, ...props }, ref) {
    return <CssPressable ref={ref} className={cn('active:opacity-60', className)} {...props} />;
  },
);

/** Læs en CSS-variabel i JS. Web returnerer `var(...)`, native læser den funktionelt. */
export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useNativeVariable
    : (variable: string) => `var(${variable})`;
