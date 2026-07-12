import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { currentUsage, OPEN_METEO_LIMITS, type Usage } from '../data/usage';

const fmt = (n: number) => n.toLocaleString('da-DK');

/**
 * Forbrug mod Open-Meteos fire grænser på gratis-planen. Det er de SAMME tællere der bruges
 * som rate-guard.
 *
 * VIGTIGT: Open-Meteo sender INGEN kvote-headers (verificeret), så tallene er vores egen,
 * lokale bogføring — pr. enhed (localStorage på web, MMKV på native). Deres grænse tælles
 * derimod pr. IP og rammer web + telefon TILSAMMEN. Tallene er derfor et minimum, ikke facit.
 */
export function UsageLine({ usage }: { usage: Usage }) {
  const used = currentUsage(usage);

  return (
    <View className="gap-0.5">
      <AppText variant="muted" className="text-xs">
        API-forbrug (denne enhed): {fmt(used.minute)}/{fmt(OPEN_METEO_LIMITS.minute)} min ·{' '}
        {fmt(used.hour)}/{fmt(OPEN_METEO_LIMITS.hour)} time ·{' '}
        {fmt(used.day)}/{fmt(OPEN_METEO_LIMITS.day)} dag ·{' '}
        {fmt(used.month)}/{fmt(OPEN_METEO_LIMITS.month)} md
      </AppText>
      <AppText variant="muted" className="text-xs">
        Tælles lokalt — de sender ingen kvote-headers · Data: Open-Meteo (CC BY 4.0)
      </AppText>
    </View>
  );
}
