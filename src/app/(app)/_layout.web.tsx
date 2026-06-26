import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useWindowDimensions } from 'react-native';

import { NavItem } from '@/components/nav/nav-item';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

const ITEMS = [
  { name: 'index', href: '/', label: 'I Dag', accent: 'text-primary' },
  { name: 'loans', href: '/loans', label: 'Lån', accent: 'text-accent-loans' },
  { name: 'settings', href: '/settings', label: 'Indstillinger', accent: 'text-fg' },
] as const;

// Token-hex (TabList er en plain RN-View → className virker ikke; vi styler via style).
const BORDER = '#e8e3da';
const CARD = '#ffffff';

/**
 * Web-skal: venstre sidebar på desktop, bund-bar på smal skærm. Ingen glas.
 * TabList + TabSlot SKAL være direkte børn af <Tabs>; TabList styles via `style`
 * (ikke className), da den renderer en almindelig RN-View.
 */
export default function AppWebLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const nav = (
    <TabList
      style={
        wide
          ? {
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: 240,
              gap: 4,
              padding: 12,
              borderRightWidth: 1,
              borderColor: BORDER,
              backgroundColor: CARD,
            }
          : {
              flexDirection: 'row',
              justifyContent: 'space-around',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderTopWidth: 1,
              borderColor: BORDER,
              backgroundColor: CARD,
            }
      }>
      {wide ? (
        <AppText variant="heading" className="px-3 pb-2 pt-3 text-primary">
          NyviaHome
        </AppText>
      ) : null}
      {ITEMS.map((item) => (
        <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
          <NavItem label={item.label} accent={item.accent} layout={wide ? 'sidebar' : 'bottom'} />
        </TabTrigger>
      ))}
    </TabList>
  );

  const content = (
    <View className="flex-1 bg-surface">
      <View className="mx-auto w-full max-w-400 flex-1">
        <TabSlot />
      </View>
    </View>
  );

  return (
    <Tabs style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
      {wide ? nav : null}
      {content}
      {wide ? null : nav}
    </Tabs>
  );
}
