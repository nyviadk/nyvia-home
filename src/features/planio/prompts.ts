import { SPOTS } from './spots';
import type { PlanioLesson, PlanioLessonInput, PlanioWeight } from './types';

/**
 * Prompterne ÉR produktet — porteret ordret fra prototypen (`ReviewUniverse-simple.jsx`).
 * Byg dem aldrig om; kun mock-arrays er byttet ud med typede parametre (Firestore-lektioner).
 */

/**
 * Pass 1 · staff/refactor-prompt-skabelon med `{{SCOPE}}`- og `{{FALSE_POSITIVES}}`-tokens.
 * Fyldes af `buildPass1` (injicerer gemte false positives). Brug IKKE denne direkte i UI'et.
 */
const PASS1_TEMPLATE = `Feature/område: {{SCOPE}}

ROLLE
Du er ikke en assistent, der "rydder op". Du er principal/staff engineer, der reviewer og refactorer denne kode som en PR, du skal godkende eller afvise. Du måler ikke succes på at koden virker (det forventes), men på Code-to-Functionality Ratio: samme eller bedre funktionalitet med markant færre linjer, lavere kobling og højere læsbarhed. En krævende senior mentor nærlæser bagefter hver eneste linje op mod sine standarder — nå den bar, FØR han ser koden, ved at der reelt ingen svagheder er, ikke ved at pynte overfladisk. Antag at tidligere clean-ups var overfladiske; stol ikke på at koden allerede er ren. Brug dit thinking-vindue fuldt, tænk 10-20-30 skridt frem, før du rører en linje.

BALANCE (vigtigst)
Reducér dér hvor der REELT er redundans — fjern død kode, merge funktioner, slet left-overs, forenkl stier. Reduktion er et sigtepunkt, ikke en kvote: opfind aldrig nedskæringer, og ofr aldrig korrekthed, robusthed eller nødvendig edge-case-håndtering for at ramme et tal. Er koden allerede lean, så sig det. OG omvendt: vær ikke handlingslammet af "for ikke at ødelægge noget med 110% sikkerhed" — kan en blok skrives med det halve antal kode UDEN at ødelægge funktionalitet eller læsbarhed, så gør det. Elegant ≠ naiv; defensiv kode må ikke skiftes ud med skrøbelig.

SKILLS: brug vercel-composition-patterns og vercel-react-native-skills aktivt.

PROTOKOL (ufravigelig rækkefølge: læs alt → forstå → lås plan → eksekvér)
1. Kør Fallow først som STÆRKT SIGNAL — ikke single source of truth. Forvent mange false positives: statisk analyse fejlflager dynamisk brugt kode (string-refs, framework-magi, runtime-registrering). Verificér HVER sletning selv ved at spore referencer; anvend aldrig auto-fix uden at læse diffen. Hver ting du afviser som false positive skriver du i false-positives-listen (output), så den kan lægges i systemet, og du ikke bruger tid på den igen næste gang. Bed om struktureret JSON.{{FALSE_POSITIVES}}
2. Læs ALLE filer i scope i deres helhed, informeret af Fallow. Skriv et kort overblik: hver fils ansvar, dataflow, al state, kald udad, offline-/error-stier, relationer på tværs. Ingen ændringer endnu.
3. Analysér — det Fallow IKKE fanger: arkitektur/struktur (forkert placeret logik, feature-grænser, left-overs) + state-maskine (derived state, useEffect der burde være onPress, waterfall-renders, unødige re-renders, loops). Dette er din egen React-semantik-analyse.
4. Lås ÉN samlet plan der dækker alle filer, i ændrings-rækkefølge. Vælg det pattern der løser problemet med færrest linjer og lavest kobling — aldrig pattern for pattern'ets skyld. Opdager du undervejs noget planen missede: stop, opdatér planen eksplicit (notér hvorfor), fortsæt ordnet. Aldrig "ret A → opdag B → ret B ad hoc".

EKSEKVERING (behavior-preserving, verificerbare trin)
Halverings-linsen på hver blok: kan den skrives med det halve antal kode uden at ødelægge funktionalitet eller læsbarhed, så gør det — ved at fjerne indirection, engangs-mellemvariabler, unødig struktur. Aldrig ved at mase til tætte one-liners; læsbarhed slår altid linjeantal. Bevis at alt du fjerner er dødt (spor alle call sites); i tvivl, lad det stå og flag det. Målrettede diffs, ikke fil-omskrivninger. Guard clauses frem for dyb if-else; deklarativ map/filter/reduce frem for lange loops; fjern any med præcise typer; fjern over-kommentering. Store JSX-filer → mindre, fokuserede komponenter. Adfærdsændringer foreslås SEPARAT, smugles aldrig ind.

ROBUSTHED (må IKKE fjernes for at spare linjer)
Offline-tilstand (fx offlineWriteBlocked) og error-/edge-case-håndtering bevares eller forbedres.

MENTOR-PASS (obligatorisk til sidst)
Skift hat til skeptisk lead. Afvis din egen PR hvis der er tilbageværende redundans, død kode, unødig state/effect, any, eller en JSX-fil der burde deles. Ret det. Gentag — men maks 3 gennemløb, så du ikke kører i ring. Samme bar som mentoren måler mod.

OUTPUT
Fallow-fund + hvilke du handlede på vs. afviste som false positives (til false-positives-listen) · fil-map + dataflow · låst plan (kort) · ændringer som målrettede diffs · risiko-log pr. ændring (hvad kunne bryde, hvordan verificeret) · linjer før→efter i % · bevidst ladt stå + hvorfor.`;

/**
 * Pass 1 · fyld skabelonen med de globalt gemte false positives, så Claude springer dem over og
 * ikke gen-verificerer de samme hver gang. Prompten beder FORTSAT om at skrive NYE false positives
 * i sit output (uændret). Tom liste → ingen ekstra blok.
 */
export const buildPass1 = (falsePositives: string[]): string => {
  const block = falsePositives.length
    ? `\n\nKENDTE FALSE POSITIVES (allerede verificeret som reelt brugt i tidligere reviews — spring dem over, brug IKKE tid på at gen-verificere dem; udvid stadig listen med nye, du finder):\n${falsePositives.map((fp) => `   - ${fp}`).join('\n')}`
    : '';
  return PASS1_TEMPLATE.replace('{{FALSE_POSITIVES}}', block);
};

/**
 * Fase 3 · Løs mentor-feedback. Kør EFTER PR'en er lavet og mentor har givet konkret feedback.
 * Injicerer PROD-ID + feature-navn + den rå feedback ordret (mentorens ord) som fuld kontekst,
 * så Claude løser i koden — ikke bare noterer. `feedback` er allerede formateret (én eller flere
 * runder) af kalderen.
 */
export const buildResolve = (args: { prodId: string; feature: string; feedback: string }): string => {
  const header = [args.feature, args.prodId].filter(Boolean).join(' · ') || '(ingen feature angivet)';
  return `Feature: ${header}

Jeg har fået konkret feedback fra min mentor på denne feature, efter PR'en er lavet. Den skal LØSES i koden — ikke bare noteres. Du har koden. Løs hvert punkt ordentligt: find roden, ret på klasse-niveau (den ene ændring der forhindrer hele klassen af samme fejl i at komme igen), ikke et plaster. Skån mig ikke; hvis feedbacken afdækker et dybere problem, så sig det.

MENTORENS FEEDBACK (ordret):
${args.feedback.trim() || '[ingen feedback valgt]'}

For hvert punkt:
- Rod-årsag (fil + linje), ikke symptomet.
- Klasse-fix: den centrale rettelse + hvorfor den lukker hele klassen.
- En test der fejler på nuværende adfærd og passerer efter.
- Bekræft at intet andet brød (offline-/error-stier bevaret).

TIL SIDST: kort tjekliste over hvad der er løst, hvad der bevidst er ladt stå (+ hvorfor), og om noget i feedbacken peger på en ny blind vinkel, jeg bør tilføje til min knowledgebase.`;
};

/** Kun kritisk + tilbagevendende lektioner pr. blind vinkel injiceres (bloat-kontrol). */
export const curated = (lessons: PlanioLesson[], spotId: string): PlanioLesson[] =>
  lessons.filter((l) => l.spot === spotId && (l.weight === 'kritisk' || l.weight === 'tilbagevendende'));

/** Pass 2 · blind-vinkel-sweep — samlet dynamisk af de kuraterede lektioner (fuld lesson + fix). */
export const buildPass2 = (lessons: PlanioLesson[]): string => {
  const block = (s: (typeof SPOTS)[number]) => {
    const ls = curated(lessons, s.id);
    const body = ls.length
      ? ls.map((l) => `   - [${l.weight}] ${l.lesson}\n     → fix: ${l.fix}`).join('\n')
      : '   (ingen kritiske/tilbagevendende endnu)';
    return `── ${s.name.toUpperCase()} ──\n${s.lenses.map((x) => '   ' + x).join('\n')}\n  Lektioner jeg før er blevet bidt af:\n${body}`;
  };
  return `Feature/område: {{SCOPE}}

Du reviewer denne feature mod mine 3 dokumenterede blinde vinkler, FØR jeg sender til min mentor. Du har koden. For hver der bider: flag konkrete steder (fil + linje), hvorfor det bider, et fix på KLASSE-niveau, og en test der fejler på nuværende adfærd. Skån mig ikke. Start med en oversigt over hvilke der er grønne, og hvilke der bider.

${SPOTS.map(block).join('\n\n')}

TIL SIDST: fandt du noget der IKKE passer under nogen af ovenstående? Flag det separat — det kan være en ny blind vinkel, jeg skal tilføje.`;
};

/** Intake · sender HELE arkivet + rå feedback, beder ekstern Claude om FINDING-format + dedup. */
export const buildIntake = (raw: string, lessons: PlanioLesson[]): string => {
  const archive = lessons.map((l) => `- [${l.spot} · ${l.weight}] ${l.lesson} (fix: ${l.fix})`).join('\n');
  return `Her er hele min eksisterende knowledgebase (alle lektioner):
${archive}

Her er ny rå feedback:
${raw && raw.trim() ? raw.trim() : '[indsæt rå feedback her, eller indsæt den ovenfor]'}

Opgave: omsæt inputtet til mit faste FINDING-format nedenfor.

FULDSTÆNDIGHED: Producér ÉN FINDING pr. DISTINKT problem, og dæk ALLE distinkte problemer i inputtet — et review med mange punkter skal give mange FINDINGs. Collaps ALDRIG et helt review til én FINDING.

DEDUP: Er to punkter samme KLASSE af fejl, så merge dem til ÉN FINDING med "Status: SKÆRPER: <lektion>". Skærper en finding en EKSISTERENDE lektion fra arkivet ovenfor, så referér den under Status (vi laver aldrig en næsten-ens dublet). Men distinkte problemer får HVER sin FINDING.

VÆGT: kritisk hvis den ville have blokeret et review, tilbagevendende hvis mønstret er set før, ellers enkelt.

OUTPUT: KUN FINDING-blokke, i markdown — ingen preamble, ingen opsummering, ingen prosa. Adskil hver FINDING med en linje der KUN indeholder "---".

FINDING
- Blind vinkel: scale | async | trust | generelle
- Linse: <hvilken linse>
- Status: NY | SKÆRPER: <lektion>
- Lektion (klasse-niveau): <hvad kan læres, så det ikke gentager sig>
- Klasse-fix: <den ene centrale rettelse der forhindrer genindførelse>
- Vægt: kritisk | tilbagevendende | enkelt`;
};

/** Planlægning · plan-tjek mod de 3 blinde vinkler (kuraterede lektioner; planen ligger i chatten). */
export const buildPlan = (lessons: PlanioLesson[]): string => {
  const block = (s: (typeof SPOTS)[number]) =>
    `${s.name}: ${curated(lessons, s.id).map((l) => l.lesson).join(' · ') || '(ingen lektioner endnu)'}`;
  return `Du har lige lavet en plan for denne feature (den ligger i denne chat). FØR jeg bygger: tjek planen mod mine 3 blinde vinkler.

Mine blinde vinkler + lektioner jeg før er blevet bidt af:
${SPOTS.slice(0, 3).map(block).join('\n')}

For hver blind vinkel: peger planen ind i en fælde jeg før er faldet i? Giv konkrete design-beslutninger at træffe NU, så jeg ikke bygger problemet ind:
- Skala: hvor kan N vokse? paginer/chunk fra start; hvilken fixture-størrelse?
- Asynk: hvilke side-effects lander bag køer? gør dem idempotente + planlæg recovery.
- Trust: hvilke public endpoints/client-writes? auth-model + server-ejede felter fra dag 1.

Afslut med en kort, konkret tjekliste.`;
};

/**
 * Parser Claudes FINDING-markdown → en lektion. Læser linje-for-linje (robust mod bullets og
 * "(klasse-niveau)"-parentesen i det faste format). Returnerer null hvis blind vinkel mangler.
 * Status (NY/SKÆRPER) læses ikke — dedup afgøres eksternt; skærper man, sletter man den gamle.
 */
function parseFindingBlock(text: string): PlanioLessonInput | null {
  const get = (key: string): string | undefined => {
    const m = text.match(new RegExp('^\\s*[-*]?\\s*' + key + '[^:\\n]*:\\s*(.+)$', 'im'));
    return m?.[1]?.trim();
  };
  const rawSpot = (get('Blind vinkel') || '').toLowerCase().split('|')[0].trim();
  const spot = SPOTS.find((s) => rawSpot.includes(s.id))?.id;
  if (!spot) return null;
  const w = (get('Vægt') || '').toLowerCase();
  const weight: PlanioWeight = w.includes('kritisk')
    ? 'kritisk'
    : w.includes('tilbage')
      ? 'tilbagevendende'
      : 'enkelt';
  const lesson = get('Lektion') || '(lektion)';
  const fix = get('Klasse-fix') || get('Fix') || '(fix)';
  const src = get('Kilde');
  return { spot, weight, lesson, fix, ...(src ? { src } : {}) };
}

/**
 * Parser ALLE FINDING-blokke i et indsat markdown → én lektion pr. blok. Splitter primært på en
 * linje med kun "---" (samme separator som format-prompten beder om); findes den ikke, deles der
 * på hver "Blind vinkel:"-linje. Tolerant over for whitespace/prosa mellem blokke; ugyldige
 * blokke (uden blind vinkel) droppes.
 */
export function parseFindings(text: string): PlanioLessonInput[] {
  let blocks = text.split(/^[ \t]*-{3,}[ \t]*$/m);
  if (blocks.length <= 1) {
    blocks = text.split(/(?=^[ \t]*[-*]?[ \t]*Blind vinkel[ \t]*:)/im);
  }
  const out: PlanioLessonInput[] = [];
  for (const block of blocks) {
    const parsed = parseFindingBlock(block);
    if (parsed) out.push(parsed);
  }
  return out;
}
