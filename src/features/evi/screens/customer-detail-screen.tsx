import { useState } from 'react';

import { DeleteEntityLink } from '@/components/ui/delete-entity-link';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { AppText } from '@/components/ui/text';
import { notify, notifySaved } from '@/lib/toast/notify';
import { View } from '@/tw';
import { AnswerField } from '../components/answer-field';
import { AnswerView } from '../components/answer-view';
import { InlineTextInput } from '../components/inline-text-input';
import { KeyInfoCard } from '../components/key-info-card';
import { VaultModal } from '../components/vault-modal';
import {
  deleteEviCustomer,
  renameEviCustomer,
  setEviAnswer,
} from '../data/evi-customers.repository';
import { useEviCustomersStore } from '../data/evi-customers-store';
import { markEviPendingDelete, unmarkEviPendingDelete } from '../data/evi-pending-deletes';
import { useEviTemplateStore } from '../data/evi-template-store';
import { formatAnswerText } from '../format';
import { collectReuseValues } from '../reuse';
import type { EviAnswerValue, EviField } from '../types';

interface Section {
  name: string | null;
  fields: EviField[];
}

function groupBySection(fields: EviField[]): Section[] {
  const out: Section[] = [];
  for (const f of fields) {
    const name = f.section?.trim() || null;
    const last = out[out.length - 1];
    if (last && last.name === name) last.fields.push(f);
    else out.push({ name, fields: [f] });
  }
  return out;
}

const MODE_OPTIONS = [
  { value: 'view' as const, label: 'Ren visning' },
  { value: 'edit' as const, label: 'Rediger' },
];

export function EviCustomerDetailScreen({ id }: { id: string }) {
  const customer = useEviCustomersStore((s) => s.items.find((c) => c.id === id));
  const allFields = useEviTemplateStore((s) => s.fields);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  if (!customer) {
    return (
      <Screen>
        <AppText variant="muted">Kunden findes ikke (eller er blevet slettet).</AppText>
      </Screen>
    );
  }

  const answers = customer.answers ?? {};

  const runSave = (p: Promise<unknown>) => {
    p.then(
      () => notifySaved(),
      () => notify('Kunne ikke gemme — prøv igen'),
    );
  };

  const saveAnswer = (fieldId: string, value: EviAnswerValue) =>
    runSave(setEviAnswer(id, fieldId, value));
  const saveName = (name: string) => {
    if (name === '' || name === customer.companyName) return;
    runSave(renameEviCustomer(id, name));
  };

  const active = allFields.filter((f) => !f.archived);
  const archivedWithAnswers = allFields.filter(
    (f) => f.archived && formatAnswerText(f, answers[f.id]) !== '',
  );
  const sections = groupBySection(active);
  const reuseValues = collectReuseValues(allFields, answers);
  // Firmanavnet er kundens companyName (ikke et skabelon-felt) — gør det til kopiér-kilde
  // 'kundenavn', så fx "Evi-mail" kan kopiere det.
  if (customer.companyName.trim() !== '') {
    reuseValues.set('kundenavn', {
      key: 'kundenavn',
      label: 'Firmanavn',
      kind: 'text',
      value: customer.companyName,
    });
  }

  return (
    <Screen>
      <AppText variant="title" numberOfLines={1}>
        {customer.companyName || 'Uden navn'}
      </AppText>

      <Segmented<'view' | 'edit'> value={mode} options={MODE_OPTIONS} onChange={setMode} />

      {mode === 'edit' ? (
        <FormField label="Firmanavn">
          <InlineTextInput value={customer.companyName} onSave={saveName} placeholder="Firmanavn" />
        </FormField>
      ) : null}

      <KeyInfoCard fields={allFields} answers={answers} />

      {active.length === 0 ? (
        <AppText variant="muted">
          Skabelonen har ingen felter endnu. Åbn “Skabelon” for at tilføje felter.
        </AppText>
      ) : (
        sections.map((section, i) => (
          <View key={section.name ?? `__${i}`} className="gap-5">
            {section.name ? (
              <AppText variant="heading" className="pt-2">
                {section.name}
              </AppText>
            ) : null}
            {section.fields.map((f) =>
              mode === 'edit' ? (
                <AnswerField
                  key={f.id}
                  field={f}
                  value={answers[f.id]}
                  onSave={(v) => saveAnswer(f.id, v)}
                  reuseValues={reuseValues}
                />
              ) : (
                <AnswerView key={f.id} field={f} value={answers[f.id]} />
              ),
            )}
          </View>
        ))
      )}

      {archivedWithAnswers.length > 0 ? (
        <View className="gap-2 pt-2">
          <AppText variant="heading">Tidligere felter</AppText>
          {archivedWithAnswers.map((f) => (
            <View key={f.id} className="flex-row items-baseline justify-between gap-3">
              <AppText variant="muted">{f.label}</AppText>
              <AppText variant="label" className="flex-1 text-right">
                {formatAnswerText(f, answers[f.id])}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {mode === 'edit' ? (
        <DeleteEntityLink
          label="Slet kunde"
          name={customer.companyName || 'Kunde'}
          markPending={() => markEviPendingDelete(id)}
          unmarkPending={() => unmarkEviPendingDelete(id)}
          remove={() => deleteEviCustomer(id)}
        />
      ) : null}

      <VaultModal />
    </Screen>
  );
}
