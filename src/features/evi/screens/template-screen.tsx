import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { TemplateEditor } from '../components/template-editor';
import { useEviTemplateStore } from '../data/evi-template-store';

export function EviTemplateScreen() {
  const fields = useEviTemplateStore((s) => s.fields);
  const loading = useEviTemplateStore((s) => s.loading);

  return (
    <Screen>
      <AppText variant="title">Skabelon</AppText>
      <AppText variant="muted">
        Felterne her gælder alle kunder. Ret et felt → det slår igennem på alle (også tidligere).
        Nye felter er tomme på gamle kunder; fjernede felter skjules, men svar bevares.
      </AppText>
      {loading ? null : <TemplateEditor initialFields={fields} />}
    </Screen>
  );
}
