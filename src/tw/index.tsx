/**
 * Centrale, className-styrede komponenter til NyviaHome.
 *
 * react-native-css leverer drop-in-komponenter der allerede er css-interop-wrappede
 * og typet som de ægte react-native-komponenter. `className` er globalt typet via
 * `react-native-css/types` (se nativewind-env.d.ts), så vi får fuld type-sikkerhed
 * uden manuelle wrappers eller `any`.
 */
import { useNativeVariable } from 'react-native-css';

export {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native-css/components';

/** Læs en CSS-variabel i JS. Web returnerer `var(...)`, native læser den funktionelt. */
export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useNativeVariable
    : (variable: string) => `var(${variable})`;
