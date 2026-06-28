import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { View } from '@/tw';

/** "Fandt X transaktioner. Heraf Y interne overførsler og Z dubletter." */
export function ImportSummary({
  fileName,
  total,
  willImport,
  expense,
  income,
  internal,
  duplicates,
}: {
  fileName: string;
  total: number;
  willImport: number;
  expense: number;
  income: number;
  internal: number;
  duplicates: number;
}) {
  return (
    <Card className="gap-2 border-0 bg-accent-budget">
      <AppText className="text-on-primary/80">{fileName}</AppText>
      <AppText className="text-2xl font-bold text-on-primary">Fandt {total} transaktioner</AppText>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Stat label="Importeres" value={willImport} />
        <Stat label="Udgifter" value={expense} />
        <Stat label="Indtægter" value={income} />
        <Stat label="Interne overførsler" value={internal} />
        <Stat label="Dubletter (ignoreres)" value={duplicates} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <AppText className="text-on-primary/90">
      {label}: <AppText className="font-semibold text-on-primary">{value}</AppText>
    </AppText>
  );
}
