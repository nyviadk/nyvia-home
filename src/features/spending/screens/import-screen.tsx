import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/text";
import { nowISO } from "@/lib/datetime";
import { toastAfter } from "@/lib/toast/notify";
import { Switch, View } from "@/tw";
import { BulkProgress } from "../components/bulk-progress";
import { ImportBatchRow } from "../components/import-batch-row";
import { ImportSummary } from "../components/import-summary";
import {
  ReviewFilterBar,
  type ReviewFilter,
  type ReviewFilterOption,
} from "../components/review-filter-bar";
import { ReviewRow } from "../components/review-row";
import { useImportBatchesStore } from "../data/import-batches-store";
import { createImportBatch } from "../data/import-batches.repository";
import { useSpendingSettingsStore } from "../data/spending-settings-store";
import { setOwnAccounts } from "../data/spending-settings.repository";
import { useTransactionsStore } from "../data/transactions-store";
import { importTransactions } from "../data/transactions.repository";
import {
  buildImportPreview,
  type ImportPreview,
  type ReviewRow as ReviewRowData,
} from "../lib/build-import";
import { pickAndReadCsv } from "../lib/import-file";
import { makeClassifier } from "../spending.utils";
import type { OwnAccount, TransactionKind } from "../types";

export function ImportScreen() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [progress, setProgress] = useState<{
    label: string;
    done: number;
    total: number;
  } | null>(null);
  const cancelRef = useRef(false);

  // Udkast for konti der først dukker op i denne CSV (number → navn + intern-kryds + tekst).
  const [newDrafts, setNewDrafts] = useState<
    Record<string, { name: string; internal: boolean; text: string }>
  >({});

  const accounts = useSpendingSettingsStore((s) => s.accounts);
  const batches = useImportBatchesStore((s) => s.batches);

  // Konti der optræder som export-konto er helt sikkert mine egne → default intern.
  const exportNumbers = new Set((preview?.rows ?? []).map((r) => r.account));

  const draftFor = (acc: {
    number: string;
    text: string;
  }): { name: string; internal: boolean; text: string } =>
    newDrafts[acc.number] ?? {
      name: "",
      internal: exportNumbers.has(acc.number),
      text: acc.text,
    };

  // Konti til live-klassifikation: gemte konti + de nye (med udkast-navn/intern/tekst).
  const newAccountList: OwnAccount[] = (preview?.newAccounts ?? []).map(
    (acc) => {
      const d = draftFor(acc);
      return {
        number: acc.number,
        name: d.name.trim(),
        internal: d.internal,
        text: d.text.trim(),
      };
    },
  );
  const effectiveAccounts = [...accounts, ...newAccountList];
  const classify = makeClassifier(effectiveAccounts);

  async function onPick() {
    setError(null);
    setBusy(true);
    try {
      const file = await pickAndReadCsv();
      if (!file) return;
      const existingIds = new Set(
        useTransactionsStore.getState().transactions.map((t) => t.id),
      );
      const result = buildImportPreview(
        file.content,
        file.name,
        { accounts },
        existingIds,
      );
      if (result.total === 0) {
        setError("Kunne ikke læse transaktioner — er det en Nykredit-CSV?");
        return;
      }
      setNewDrafts({});
      setFilter("all");
      setPreview(result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Noget gik galt under indlæsning.",
      );
    } finally {
      setBusy(false);
    }
  }

  function patchRow(
    id: string,
    patch: { include?: boolean; kindOverride?: TransactionKind },
  ) {
    setPreview((p) =>
      p
        ? {
            ...p,
            rows: p.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : p,
    );
  }

  function setDuplicatesIncluded(on: boolean) {
    setPreview((p) =>
      p
        ? {
            ...p,
            rows: p.rows.map((r) => (r.duplicate ? { ...r, include: on } : r)),
          }
        : p,
    );
  }

  async function onApprove() {
    if (!preview) return;
    const included = preview.rows.filter((r) => r.include);
    if (included.length === 0) {
      setPreview(null);
      return;
    }
    setBusy(true);
    cancelRef.current = false;
    const total = included.length;
    const now = nowISO();
    try {
      // Gem nye konti (med navne) så interne overførsler kendes fremover og bagud.
      if (preview.newAccounts.length > 0) {
        setProgress({ label: "Gemmer konti…", done: 0, total });
        await setOwnAccounts(effectiveAccounts);
      }
      setProgress({ label: "Opretter import…", done: 0, total });
      const batchId = await createImportBatch({
        fileName: preview.fileName,
        importedAt: now,
        count: total,
        internalCount: included.filter((r) => classify(r) === "internal").length,
        duplicateCount: preview.duplicates,
        createdAt: now,
      });
      setProgress({ label: "Skriver transaktioner…", done: 0, total });
      await importTransactions(included, batchId, {
        onProgress: (done, t) => setProgress({ label: "Skriver transaktioner…", done, total: t }),
        shouldCancel: () => cancelRef.current,
      });
      await toastAfter(
        Promise.resolve(),
        cancelRef.current
          ? "Import annulleret (delvist importeret — kan slettes i historikken)"
          : `${total} transaktioner importeret`,
      );
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fejlede.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const rows = preview?.rows ?? [];
  const isExpense = (r: ReviewRowData) =>
    !r.duplicate && classify(r) === "expense";
  const isIncome = (r: ReviewRowData) =>
    !r.duplicate && classify(r) === "income";
  const isInternal = (r: ReviewRowData) =>
    !r.duplicate && classify(r) === "internal";

  const willImport = rows.filter((r) => r.include).length;
  const expenseCount = rows.filter(isExpense).length;
  const incomeCount = rows.filter(isIncome).length;
  const internalCount = rows.filter(isInternal).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;
  const allDuplicatesIncluded =
    duplicateCount > 0 && rows.every((r) => !r.duplicate || r.include);

  const allFilterOptions: ReviewFilterOption[] = [
    { key: "all", label: "Alle", count: rows.length },
    { key: "included", label: "Importeres", count: willImport },
    { key: "expense", label: "Udgifter", count: expenseCount },
    { key: "income", label: "Indtægter", count: incomeCount },
    { key: "internal", label: "Interne", count: internalCount },
    { key: "duplicate", label: "Dubletter", count: duplicateCount },
  ];
  const filterOptions = allFilterOptions.filter((o) => {
    if (o.key === "all") return true;
    if (o.count === 0) return false;
    if (o.key === "included" && o.count === rows.length) return false;
    return true;
  });

  const activeFilter = filterOptions.some((o) => o.key === filter)
    ? filter
    : "all";
  const matches = (r: ReviewRowData): boolean => {
    switch (activeFilter) {
      case "included":
        return r.include;
      case "duplicate":
        return r.duplicate;
      case "expense":
        return isExpense(r);
      case "income":
        return isIncome(r);
      case "internal":
        return isInternal(r);
      default:
        return true;
    }
  };
  const visibleRows = rows
    .filter(matches)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <AppText variant="title">Importér bankdata</AppText>

      {error ? <AppText className="text-danger">{error}</AppText> : null}

      <BulkProgress
        visible={!!progress}
        label={progress?.label ?? ""}
        done={progress?.done ?? 0}
        total={progress?.total ?? 0}
        onCancel={() => {
          cancelRef.current = true;
        }}
      />

      {preview ? (
        <>
          <ImportSummary
            fileName={preview.fileName}
            total={preview.total}
            willImport={willImport}
            expense={expenseCount}
            income={incomeCount}
            internal={internalCount}
            duplicates={duplicateCount}
          />

          {preview.newAccounts.length > 0 ? (
            <Card className="gap-3">
              <View className="gap-0.5">
                <AppText variant="label">Nye konti fundet</AppText>
                <AppText variant="muted">
                  Navngiv dem, og sæt kryds i “Intern konto” ved dine egne — så
                  tæller overførsler til/fra dem ikke som forbrug. Eksterne
                  matches på transaktions-teksten.
                </AppText>
              </View>
              {preview.newAccounts.map((acc) => {
                const d = draftFor(acc);
                return (
                  <View
                    key={acc.number}
                    className="gap-1.5 border-b border-border pb-3"
                  >
                    <AppText variant="muted">ID/Konto: {acc.number}</AppText>

                    <Input
                      value={d.text}
                      onChangeText={(t) =>
                        setNewDrafts((m) => ({
                          ...m,
                          [acc.number]: { ...draftFor(acc), text: t },
                        }))
                      }
                      placeholder="Transaktions-tekst (fx Netto)"
                    />

                    <Input
                      value={d.name}
                      onChangeText={(t) =>
                        setNewDrafts((m) => ({
                          ...m,
                          [acc.number]: { ...draftFor(acc), name: t },
                        }))
                      }
                      placeholder="Navn (fx Madkonto / Dagligvarer)"
                    />
                    <View className="flex-row items-center justify-between">
                      <AppText variant="label">Intern konto (min egen)</AppText>
                      <Switch
                        value={d.internal}
                        onValueChange={(internal) =>
                          setNewDrafts((m) => ({
                            ...m,
                            [acc.number]: { ...draftFor(acc), internal },
                          }))
                        }
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {duplicateCount > 0 ? (
            <Card className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <AppText variant="label">Opdatér allerede-importerede</AppText>
                <AppText variant="muted">
                  Medtag de {duplicateCount} dubletter og overskriv dem med
                  nyeste data.
                </AppText>
              </View>
              <Switch
                value={allDuplicatesIncluded}
                onValueChange={setDuplicatesIncluded}
              />
            </Card>
          ) : null}

          <View className="flex-row gap-2">
            <Button
              title="Annullér"
              variant="secondary"
              className="flex-1"
              disabled={busy}
              onPress={() => setPreview(null)}
            />
            <Button
              title={`Godkend import (${willImport})`}
              className="flex-1"
              loading={busy}
              onPress={onApprove}
            />
          </View>

          <ReviewFilterBar
            options={filterOptions}
            value={activeFilter}
            onChange={setFilter}
          />

          <View className="gap-2">
            {visibleRows.map((row) => (
              <ReviewRow
                key={row.id}
                row={row}
                kind={classify(row)}
                onToggleInclude={(id, include) => patchRow(id, { include })}
                onChangeKind={(id, kindOverride) =>
                  patchRow(id, { kindOverride })
                }
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <AppText variant="muted">
            Vælg en CSV-eksport fra Nykredit. Filen læses lokalt — intet sendes
            til en server. Dubletter og interne overførsler spottes automatisk
            inden du godkender.
          </AppText>
          <Button title="Vælg CSV-fil" loading={busy} onPress={onPick} />

          {batches.length > 0 ? (
            <View className="gap-2 pt-4">
              <AppText variant="heading">Importhistorik</AppText>
              {batches.map((batch) => (
                <ImportBatchRow key={batch.id} batch={batch} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="Ingen import endnu"
              description="Importerede filer vises her, så du kan slette en fejl-import."
            />
          )}
        </>
      )}
    </Screen>
  );
}
