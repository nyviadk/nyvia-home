import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MoneyText } from '@/components/ui/money-text';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { confirmAction } from '@/lib/confirm';
import { formatDateCopenhagen, formatDateTimeCopenhagen } from '@/lib/datetime';
import { toastAfter } from '@/lib/toast/notify';
import { Pressable, View } from '@/tw';
import { KindBadge } from '../components/kind-badge';
import { deleteTransaction, setTransactionKindOverride } from '../data/transactions.repository';
import { useSpendingSettingsStore } from '../data/spending-settings-store';
import { useTransactionsStore } from '../data/transactions-store';
import { displayAccountName, makeClassifier, scrubFields } from '../spending.utils';
import type { TransactionKind } from '../types';

type KindChoice = 'auto' | TransactionKind;
const KIND_CHOICES: { value: KindChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'expense', label: 'Udgift' },
  { value: 'income', label: 'Indtægt' },
  { value: 'internal', label: 'Intern' },
];

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactions = useTransactionsStore((s) => s.transactions);
  const accounts = useSpendingSettingsStore((s) => s.accounts);
  const rules = useSpendingSettingsStore((s) => s.scrubRules);

  const t = transactions.find((x) => x.id === id);
  if (!t) {
    return (
      <Screen>
        <EmptyState title="Transaktion ikke fundet" description="Den er måske slettet." />
      </Screen>
    );
  }

  const scrubbed = scrubFields(t, rules);
  const classify = makeClassifier(accounts);
  const autoKind = classify({ ...t, kindOverride: undefined });
  const effective = classify(t);
  const choice: KindChoice = t.kindOverride ?? 'auto';

  async function onDelete() {
    if (!t) return;
    const ok = await confirmAction('Slet transaktion', 'Slet denne postering?', 'Slet');
    if (!ok) return;
    await toastAfter(deleteTransaction(t.id), 'Transaktion slettet');
    router.back();
  }

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="title">{scrubbed.text || scrubbed.counterparty || '—'}</AppText>
        <View className="flex-row items-center gap-2">
          <MoneyText
            ore={t.amountOre}
            variant="heading"
            className={t.amountOre < 0 ? 'text-fg' : 'text-accent-savings'}
          />
          <KindBadge kind={effective} />
        </View>
      </View>

      <Card className="gap-2">
        <AppText variant="label">Klassifikation</AppText>
        <Segmented
          value={choice}
          options={KIND_CHOICES}
          onChange={(c) => setTransactionKindOverride(t.id, c === 'auto' ? null : c)}
        />
        <AppText variant="muted">
          Auto = {kindLabel(autoKind)} (beregnet ud fra dine konti). Vælg en anden for at overstyre.
        </AppText>
      </Card>

      <Card className="gap-3">
        <Field label="Konto">{displayAccountName(t.account, accounts)}</Field>
        <Field label="Dato">{formatDateCopenhagen(t.date)}</Field>
        <Field label="Beløb">
          <MoneyText ore={t.amountOre} variant="label" />
        </Field>
        <Field label="Saldo">{t.balanceOre != null ? <MoneyText ore={t.balanceOre} variant="label" /> : '—'}</Field>
        <Field label="Tekst" raw={t.text !== scrubbed.text ? t.text : undefined}>
          {scrubbed.text || '—'}
        </Field>
        <Field label="Indbetaler" raw={t.payer && t.payer !== scrubbed.payer ? t.payer : undefined}>
          {scrubbed.payer || '—'}
        </Field>
        <Field
          label="Modtagernavn"
          raw={t.counterparty && t.counterparty !== scrubbed.counterparty ? t.counterparty : undefined}>
          {scrubbed.counterparty || '—'}
        </Field>
        <Field label="Kontohaver">{t.accountHolder || '—'}</Field>
        <Field label="Ovf.type">{t.transferType || '—'}</Field>
        <Field label="Afsenderkonto">{t.senderAccount || '—'}</Field>
        <Field label="Modtagerkonto">{t.receiverAccount || '—'}</Field>
        <Field label="Importeret">{formatDateTimeCopenhagen(t.importedAt)}</Field>
      </Card>

      <View className="items-center pb-2 pt-4">
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
          <AppText className="text-sm text-danger">Slet transaktion</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function kindLabel(kind: TransactionKind): string {
  return kind === 'expense' ? 'Udgift' : kind === 'income' ? 'Indtægt' : 'Intern';
}

/** Etiket + værdi; valgfri rå (uberørt) værdi vises dæmpet nedenunder. */
function Field({ label, raw, children }: { label: string; raw?: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-b border-border pb-2">
      <AppText variant="muted">{label}</AppText>
      <View className="flex-1 items-end">
        <AppText variant="label" className="text-right">
          {children}
        </AppText>
        {raw ? (
          <AppText variant="muted" className="text-right">
            rå: {raw}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
