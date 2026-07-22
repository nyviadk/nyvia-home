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
 * Pressable med indbygget tryk-feedback: falmer let (opacity) mens den holdes nede — på ALLE
 * platforme, så man på mobil (ingen hover) tydeligt kan se at knappen er ramt. Feedbacken
 * lægges KUN i pressed-state, så className-opacity (fx disabled `opacity-50`) bevares ellers,
 * og komponeres oven på en evt. eksisterende `style` (funktion eller værdi) samt `active:`/
 * `hover:`-klasser. Ref forwardes, så `<Link asChild>` fortsat virker.
 */
export const Pressable = forwardRef<ComponentRef<typeof CssPressable>, PressableProps>(
  function Pressable({ style, ...props }, ref) {
    return (
      <CssPressable
        ref={ref}
        style={(state) => {
          const base = typeof style === 'function' ? style(state) : style;
          return state.pressed ? [base, { opacity: 0.6 }] : base;
        }}
        {...props}
      />
    );
  },
);

/** Læs en CSS-variabel i JS. Web returnerer `var(...)`, native læser den funktionelt. */
export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useNativeVariable
    : (variable: string) => `var(${variable})`;
