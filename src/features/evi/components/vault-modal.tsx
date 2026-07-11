import { useState } from 'react';
import { Modal } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { Pressable, View } from '@/tw';
import {
  setupVault,
  unlockVaultWith,
  useEviVaultStore,
  WrongPassphraseError,
} from '../crypto/vault-store';
import { resolveVaultGate, useVaultGate } from './vault-gate';

/**
 * Boks-modal til følsomme felter. Første gang (status 'absent') = opret adgangssætning;
 * ellers lås op. Adgangssætningen gemmes aldrig; ingen nulstilling (kun brugeren kender den).
 * Monteres ét sted (kunde-detaljeskærmen), styres via vault-gate.
 */
export function VaultModal() {
  const open = useVaultGate((s) => s.open);
  const status = useEviVaultStore((s) => s.status);
  const isSetup = status === 'absent';

  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setPass('');
    setConfirm('');
    setError(null);
    setBusy(false);
  };
  const cancel = () => {
    reset();
    resolveVaultGate(false);
  };

  const submit = async () => {
    setError(null);
    if (pass.length < 8) {
      setError('Vælg mindst 8 tegn.');
      return;
    }
    if (isSetup && pass !== confirm) {
      setError('Adgangssætningerne er ikke ens.');
      return;
    }
    setBusy(true);
    try {
      if (isSetup) await setupVault(pass);
      else await unlockVaultWith(pass);
      reset();
      resolveVaultGate(true);
    } catch (e) {
      setBusy(false);
      if (e instanceof WrongPassphraseError) setError('Forkert adgangssætning.');
      else setError(e instanceof Error ? e.message : 'Noget gik galt.');
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={cancel}>
      <Pressable
        onPress={cancel}
        style={{ backgroundColor: 'rgba(40, 40, 38, 0.35)', cursor: 'auto' }}
        className="flex-1 items-center justify-center p-6">
        <Pressable
          onPress={() => {}}
          style={{
            boxShadow: '0 8px 24px rgba(40, 40, 38, 0.18)',
            borderCurve: 'continuous',
            cursor: 'auto',
          }}
          className="w-full max-w-96 gap-3 rounded-2xl border border-border bg-card p-5">
          <AppText variant="heading">
            {isSetup ? 'Opret adgangssætning' : 'Lås følsomme felter op'}
          </AppText>
          <AppText variant="muted">
            {isSetup
              ? 'Vælg en stærk adgangssætning. Den gemmes ALDRIG og kan ikke nulstilles — husk den (fx i din personlige password-manager). Kræver internet.'
              : 'Indtast din adgangssætning for at se/kopiere følsomme felter. Kræver internet.'}
          </AppText>
          <Input
            value={pass}
            onChangeText={setPass}
            placeholder="Adgangssætning"
            secureTextEntry
            autoFocus
            onSubmitEditing={isSetup ? undefined : () => void submit()}
          />
          {isSetup ? (
            <Input
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Gentag adgangssætning"
              secureTextEntry
              onSubmitEditing={() => void submit()}
            />
          ) : null}
          {error ? <AppText className="text-danger">{error}</AppText> : null}
          <View className="flex-row justify-end gap-2 pt-1">
            <Button title="Annullér" variant="secondary" className="h-11 px-4" onPress={cancel} />
            <Button
              title={isSetup ? 'Opret' : 'Lås op'}
              className="h-11 px-5"
              loading={busy}
              onPress={() => void submit()}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
