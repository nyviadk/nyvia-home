import { AppText } from '@/components/ui/text';
import { notify, toastAfter } from '@/lib/toast/notify';
import { Pressable } from '@/tw';
import { decryptValue } from '../crypto/vault-store';
import type { ReuseValue } from '../reuse';
import { requestVaultAccess } from './vault-gate';

const isWeb = process.env.EXPO_OS === 'web';

function copyText(text: string) {
  if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
    void toastAfter(navigator.clipboard.writeText(text), 'Kopieret');
  }
}

/** Kopiér-frem chip: kopierer en tidligere indtastet værdi (web). Følsomme kilder dekrypteres. */
export function ReuseChip({ reuse }: { reuse: ReuseValue }) {
  const onPress = async () => {
    if (reuse.kind === 'text') {
      copyText(reuse.value);
      return;
    }
    if (!(await requestVaultAccess())) return;
    try {
      copyText(await decryptValue(reuse.cipher));
    } catch {
      notify('Kunne ikke dekryptere');
    }
  };

  return (
    <Pressable
      accessibilityRole={isWeb ? 'button' : 'text'}
      onPress={() => void onPress()}
      hitSlop={4}
      style={{ borderCurve: 'continuous' }}
      className="flex-row items-center gap-1.5 self-start rounded-full border border-border bg-element px-3 py-1.5 hover:bg-selected">
      <AppText variant="muted" className="text-xs">
        {reuse.kind === 'sensitive' ? `🔒 ${reuse.label}` : `${reuse.label}:`}
      </AppText>
      {reuse.kind === 'text' ? (
        <AppText variant="label" numberOfLines={1} style={{ maxWidth: 220 }} className="text-xs">
          {reuse.value}
        </AppText>
      ) : null}
      {isWeb ? (
        <AppText variant="muted" className="text-xs">
          ⧉
        </AppText>
      ) : null}
    </Pressable>
  );
}
