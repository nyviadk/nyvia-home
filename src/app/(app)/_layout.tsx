import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabsLayout() {
  return (
    <NativeTabs tintColor="#2f7d6b">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>I Dag</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budget">
        <NativeTabs.Trigger.Label>Budget</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.pie.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="loans">
        <NativeTabs.Trigger.Label>Lån</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="creditcard.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="subscriptions">
        <NativeTabs.Trigger.Label>Abonnementer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.triangle.2.circlepath" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="timetracker">
        <NativeTabs.Trigger.Label>Timetracker</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Indstillinger</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
