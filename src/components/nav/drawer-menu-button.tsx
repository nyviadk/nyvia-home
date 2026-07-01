import { useNavigation } from 'expo-router';

import { Pressable, View } from '@/tw';

const FG = '#2a2a28';
const LINE = { width: 22, height: 2, borderRadius: 1, backgroundColor: FG } as const;

/**
 * Hamburger til feature-listernes header (native). Åbner draweren via forælder-
 * navigatoren (feature-stakken → drawer). Bruges som headerLeft på hver features
 * index-skærm, så den sidder i samme header som tilbage-knappen på undersider —
 * statisk pr. skærm (ingen dynamisk toggling → glatte native-overgange).
 */
export function DrawerMenuButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Åbn menu"
      hitSlop={10}
      onPress={() =>
        (navigation.getParent() as { openDrawer?: () => void } | undefined)?.openDrawer?.()
      }
      style={{
        width: 40,
        height: 40,
        marginLeft: 4,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}>
      <View style={LINE} />
      <View style={LINE} />
      <View style={LINE} />
    </Pressable>
  );
}

/**
 * Delte header-options til en features index-skærm: hamburger + flad, tom header
 * (titlen står i selve skærmen). Kun native — på web bruges sidebaren, så index
 * beholder headerShown:false og sin egen titel.
 */
export const drawerListHeaderOptions = {
  headerShown: process.env.EXPO_OS !== 'web',
  headerLeft: () => <DrawerMenuButton />,
  headerTitle: '',
  headerShadowVisible: false,
  headerStyle: { backgroundColor: '#ffffff' },
};
