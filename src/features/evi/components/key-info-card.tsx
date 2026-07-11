import { Card } from '@/components/ui/card';
import { CopyableRow } from '@/components/ui/copyable-row';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';
import { formatAnswerText } from '../format';
import type { EviAnswers, EviField } from '../types';

/** Nøgle-info øverst på en kunde: de "pinned" felter (læs + kopiér på web). */
export function KeyInfoCard({ fields, answers }: { fields: EviField[]; answers: EviAnswers }) {
  const pinned = fields.filter((f) => f.pinned && !f.archived);
  if (pinned.length === 0) return null;

  return (
    <Card className="gap-3">
      {pinned.map((f) =>
        f.type === 'sensitive' ? (
          <View key={f.id} className="flex-row items-baseline justify-between gap-3">
            <AppText variant="muted">{f.label}</AppText>
            <AppText variant="label" className="flex-1 text-right">
              🔒 følsom (se nedenfor)
            </AppText>
          </View>
        ) : (
          <CopyableRow key={f.id} label={f.label} value={formatAnswerText(f, answers[f.id]) || '—'} />
        ),
      )}
    </Card>
  );
}
