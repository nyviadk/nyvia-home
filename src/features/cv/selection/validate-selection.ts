import { issue, type CvIssue } from '../issues';
import type { CvSnapshot } from '../data/catalogue-io';
import type { CvSelection } from './selection';

/**
 * Hold selectionen op mod kataloget.
 *
 * Samler ALLE fejl og stopper aldrig ved den første. Retter man én ad gangen, kører man
 * fem gange og finder en ny fejl hver gang.
 *
 * Ved en ukendt variant listes de varianter der FINDES — den oplysning er det meste af
 * værdien i beskeden.
 */
export function validateSelection(sel: CvSelection, snapshot: CvSnapshot): CvIssue[] {
  const out: CvIssue[] = [];

  const check = (ids: readonly string[], coll: keyof CvSnapshot, where: string) => {
    for (const id of ids) {
      if (!snapshot[coll][id]) {
        out.push(issue(`${where}: ${id}`, 'Findes ikke i kataloget', Object.keys(snapshot[coll])));
      }
    }
  };

  /** Det samme id to gange bliver til den samme linje to gange i det printede CV. */
  const checkDuplicates = (ids: readonly string[], where: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) out.push(issue(`${where}: ${id}`, 'Står to gange — ville blive vist dobbelt'));
      seen.add(id);
    }
  };

  check(sel.kompetencer, 'kompetencer', 'kompetencer');
  checkDuplicates(sel.kompetencer, 'kompetencer');
  /**
   * En kompetence hvis gruppe ikke findes, hører til ingen gruppe — og renderingen
   * grupperer efter gruppe, så den ville forsvinde ud af CV'et UDEN at nogen sagde noget.
   * Præcis den tavse forsvinden valideringen findes for at fange.
   */
  for (const id of sel.kompetencer) {
    const k = snapshot.kompetencer[id];
    if (k && !snapshot.grupper[k.gruppe as string]) {
      out.push(
        issue(
          `kompetencer: ${id}`,
          `Gruppen "${String(k.gruppe)}" findes ikke — kompetencen ville forsvinde fra CV'et`,
          Object.keys(snapshot.grupper)
        )
      );
    }
  }

  check(sel.uddannelse, 'uddannelse', 'uddannelse');
  check(sel.oevrig, 'jobs', 'oevrig');
  check(sel.referencer, 'referencer', 'referencer');
  check(sel.sprogfaerdigheder, 'sprogfaerdigheder', 'sprogfaerdigheder');
  checkDuplicates(sel.uddannelse, 'uddannelse');
  checkDuplicates(sel.referencer, 'referencer');
  checkDuplicates(sel.sprogfaerdigheder, 'sprogfaerdigheder');
  if (sel.reference_side1) check([sel.reference_side1], 'referencer', 'reference_side1');

  const erfaringIds = sel.erfaring.map((e) => e.id);
  checkDuplicates(erfaringIds, 'erfaring');

  /**
   * `oevrig` er den korte liste over øvrig erfaring nederst. Står et job BEGGE steder,
   * bliver det både en fuld blok med punkter og en one-liner — samme job to gange i det
   * samme CV, hvilket ser ud som en fejl fordi det er en.
   */
  for (const id of sel.oevrig) {
    if (erfaringIds.includes(id)) {
      out.push(issue(`oevrig: ${id}`, 'Jobbet står også under erfaring — vælg ét af stederne'));
    }
  }

  for (const [i, block] of sel.erfaring.entries()) {
    const job = snapshot.jobs[block.id];
    if (!job) {
      out.push(issue(`erfaring[${i}]: ${block.id}`, 'Jobbet findes ikke', Object.keys(snapshot.jobs)));
    }
    checkDuplicates(
      block.punkter.map(([id]) => id),
      `erfaring[${i}].punkter`
    );
    for (const [j, [punktId, variant]] of block.punkter.entries()) {
      const punkt = snapshot.punkter[punktId];
      const where = `erfaring[${i}].punkter[${j}]: ${punktId}`;
      if (!punkt) {
        out.push(issue(where, 'Punktet findes ikke', Object.keys(snapshot.punkter)));
        continue;
      }
      /**
       * Punktet skal høre til DET job det er sat under. Uden dette tjek kan et punkt fra
       * et andet job glide ind under en forkert overskrift, og så står der noget forkert
       * i CV'et som ingen opdager.
       */
      if (punkt.job !== block.id) {
        out.push(issue(where, `Hører til jobbet "${String(punkt.job)}", ikke "${block.id}"`));
      }
      const varianter = Object.keys((punkt.varianter ?? {}) as object);
      if (!varianter.includes(variant)) {
        out.push(issue(`${where} · ${variant}`, 'Varianten findes ikke', varianter));
      }
    }
  }

  for (const [i, [id, variant]] of sel.projekter.entries()) {
    const projekt = snapshot.projekter[id];
    if (!projekt) {
      out.push(issue(`projekter[${i}]: ${id}`, 'Findes ikke', Object.keys(snapshot.projekter)));
      continue;
    }
    const varianter = Object.keys((projekt.varianter ?? {}) as object);
    if (!varianter.includes(variant)) {
      out.push(issue(`projekter[${i}]: ${id} · ${variant}`, 'Varianten findes ikke', varianter));
    }
  }
  checkDuplicates(
    sel.projekter.map(([id]) => id),
    'projekter'
  );

  if (sel.reference_efter && !erfaringIds.includes(sel.reference_efter)) {
    out.push(
      issue(
        `reference_efter: ${sel.reference_efter}`,
        'Jobbet er ikke med i erfaring — referencen kan ikke placeres',
        erfaringIds
      )
    );
  }
  if (sel.reference_side1 && !sel.reference_efter) {
    out.push(issue('reference_efter', 'Mangler — hvilket job skal referencen ligge under?'));
  }

  return out;
}
