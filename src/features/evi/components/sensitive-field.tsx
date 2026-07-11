import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { notify, toastAfter } from '@/lib/toast/notify';
import { Pressable, Text, View } from '@/tw';
import { decryptValue, encryptValue } from '../crypto/vault-store';
import type { EviAnswerValue, EviCipher } from '../types';
import { requestVaultAccess } from './vault-gate';

const isWeb = process.env.EXPO_OS === 'web';

function ActionLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      className="rounded-md px-2 py-1 hover:bg-element">
      <Text className="text-sm font-medium text-primary">{label}</Text>
    </Pressable>
  );
}

/**
 * Følsomt felt (fx kundens password). Krypteres klientside og gemmes som ciffertekst.
 * KUN web kan se/kopiere: kræver at boksen er låst op (som kræver internet). Native viser
 * blot en låst-note. Ingen klartekst gemmes lokalt — dekryptering sker on-demand i hukommelsen.
 */
export function SensitiveField({
  value,
  onSave,
  readOnly,
}: {
  value: EviCipher | undefined;
  onSave: (value: EviAnswerValue) => void;
  /** Ren visning: kun Vis/Kopiér, ingen redigering. */
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isWeb) {
    return (
      <View className="rounded-xl border border-border bg-element px-4 py-3">
        <AppText variant="muted">🔒 Følsomt felt — kun tilgængeligt på web</AppText>
      </View>
    );
  }

  const hasValue = !!value;

  const reveal = async () => {
    if (!value) return;
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    if (!(await requestVaultAccess())) return;
    try {
      setRevealed(await decryptValue(value));
    } catch {
      notify('Kunne ikke dekryptere');
    }
  };

  const copy = async () => {
    if (!value) return;
    if (!(await requestVaultAccess())) return;
    try {
      const plain = await decryptValue(value);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await toastAfter(navigator.clipboard.writeText(plain), 'Kopieret');
      }
    } catch {
      notify('Kunne ikke dekryptere');
    }
  };

  const startEdit = () => {
    setDraft('');
    setRevealed(null);
    setEditing(true);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onSave(''); // ryd feltet
      setEditing(false);
      return;
    }
    if (!(await requestVaultAccess())) return;
    setBusy(true);
    try {
      const cipher = await encryptValue(trimmed);
      onSave(cipher);
      setEditing(false);
      setDraft('');
    } catch (e) {
      notify(e instanceof Error && e.message.includes('internet') ? 'Kræver internet' : 'Kunne ikke gemme');
    } finally {
      setBusy(false);
    }
  };

  if (editing && !readOnly) {
    return (
      <View className="gap-2">
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder="Skriv den følsomme værdi (fx password)"
          multiline
          autoFocus
          style={{ minHeight: 72, textAlignVertical: 'top' }}
          className="h-auto py-3"
        />
        <View className="flex-row gap-2">
          <ActionLink label={busy ? 'Gemmer…' : 'Gem'} onPress={() => void save()} />
          <ActionLink
            label="Annullér"
            onPress={() => {
              setEditing(false);
              setDraft('');
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
      {hasValue ? (
        <Text style={{ minWidth: 0 }} className="flex-1 break-all text-base text-fg">
          {revealed ?? '••••••••••'}
        </Text>
      ) : (
        <Text className="flex-1 text-base text-fg-muted">Tom</Text>
      )}
      <View className="flex-row items-center">
        {hasValue ? (
          <>
            <ActionLink label={revealed ? 'Skjul' : 'Vis'} onPress={() => void reveal()} />
            <ActionLink label="Kopiér" onPress={() => void copy()} />
            {!readOnly ? <ActionLink label="Skift" onPress={startEdit} /> : null}
          </>
        ) : !readOnly ? (
          <ActionLink label="Tilføj" onPress={startEdit} />
        ) : null}
      </View>
    </View>
  );
}
