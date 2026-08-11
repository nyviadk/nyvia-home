/**
 * Tegn-for-tegn-sammenligning af et forkert svar med facit.
 *
 * "Forkert" alene fortæller ikke hvad man skal rette. Skrev man *manana* i stedet for
 * *mañana*, er 99 % af svaret rigtigt, og det ene tegn er hele pointen — det skal kunne ses
 * uden at man selv skal stave sig igennem begge strenge.
 *
 * Derfor markeres BEGGE sider: det man skrev for meget eller forkert, og det man udelod.
 * Kun den ene side ville tabe halvdelen af fejlene — skriver man *quero* for *quiero*, er
 * hvert eneste tegn man tastede jo rigtigt; fejlen er det tegn der mangler.
 */
export interface DiffPart {
  text: string;
  /** Del af forskellen — markeres i UI'et. */
  changed: boolean;
}

/**
 * Over denne længde springes sammenligningen over. Tabellen er `n × m`, så en lang tekst
 * mod en lang tekst vokser i anden potens; grænsen ligger langt over enhver gloses eller
 * sætnings længde og findes kun for at en afsindig indtastning ikke kan fryse skærmen.
 */
const MAX_LENGTH = 400;

/** Store og små bogstaver er ikke en fejl, jf. `normalize` i quiz-card. */
const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Naboer med samme markering slås sammen, så UI'et får få dele frem for ét tegn ad gangen. */
function group(text: string, changed: readonly boolean[]): DiffPart[] {
  const parts: DiffPart[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.changed === changed[i]) last.text += text[i];
    else parts.push({ text: text[i], changed: changed[i] });
  }
  return parts;
}

/**
 * Længste fælles delsekvens. Det er den samme algoritme som `diff` på tekstfiler, bare på
 * tegn: alt der IKKE indgår i den fælles sekvens, er forskellen.
 */
export function diffAnswer(
  answer: string,
  facit: string
): { answer: DiffPart[]; facit: DiffPart[] } {
  const whole = {
    answer: answer ? [{ text: answer, changed: true }] : [],
    facit: facit ? [{ text: facit, changed: true }] : [],
  };
  if (answer.length > MAX_LENGTH || facit.length > MAX_LENGTH) return whole;

  const n = answer.length;
  const m = facit.length;

  // dp[i][j] = længden af den fælles delsekvens fra answer[i…] og facit[j…].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq(answer[i], facit[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const answerChanged: boolean[] = [];
  const facitChanged: boolean[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(answer[i], facit[j])) {
      answerChanged.push(false);
      facitChanged.push(false);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      answerChanged.push(true); // stod kun i svaret → for meget/forkert
      i++;
    } else {
      facitChanged.push(true); // stod kun i facit → udeladt
      j++;
    }
  }
  while (i < n) answerChanged.push(true), i++;
  while (j < m) facitChanged.push(true), j++;

  return { answer: group(answer, answerChanged), facit: group(facit, facitChanged) };
}
