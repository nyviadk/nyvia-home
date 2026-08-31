import type { CvCssVars } from './cv-metrics';

/**
 * Print-CSS'en, porteret fra prototypens `render.py`.
 *
 * Filen INTERPOLERER kun — al regning bor i `cv-metrics.ts`. Det holder CSS'en læsbar som
 * CSS og regnestykket testbart som regnestykke.
 *
 * Bemærk: skabelonstrengen brydes af en backtick eller et literalt `${`. Almindelig CSS har
 * ingen af delene (`content: ""` er fint), men det er værd at vide før man tilføjer noget.
 *
 * ÆNDRING fra prototypen: `@page { margin: 0 }` og margenerne som padding på `.side`.
 * Chromes margen-menu tilsidesætter `@page`, og så passer den auto-tilpasning appen lige
 * har målt ikke længere. Med margin:0 er indholdsboksen låst, og det målte er det printede.
 * Alle mål er ellers uændrede.
 */
export const cvCss = (v: CvCssVars): string => `
@font-face { font-family:'Source Serif 4'; src:url('/fonts/SourceSerif4-Regular.ttf') format('truetype'); font-weight:400; font-style:normal; font-display:block; }
@font-face { font-family:'Source Serif 4'; src:url('/fonts/SourceSerif4-Italic.ttf') format('truetype'); font-weight:400; font-style:italic; font-display:block; }
@font-face { font-family:'Source Serif 4'; src:url('/fonts/SourceSerif4-Bold.ttf') format('truetype'); font-weight:700; font-style:normal; font-display:block; }
@font-face { font-family:'Archivo'; src:url('/fonts/Archivo-Regular.ttf') format('truetype'); font-weight:400; font-style:normal; font-display:block; }
@font-face { font-family:'Archivo'; src:url('/fonts/Archivo-Bold.ttf') format('truetype'); font-weight:700; font-style:normal; font-display:block; }

@page { size: A4 portrait; margin: 0; }
:root { --ink:#1c1a17; --muted:#6f675e; --hair:#ddd7cf; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:${v.serif}; font-size:${v.krop}pt; line-height:${v.lh};
       color:var(--ink); orphans:2; widows:2; background:#fff;
       /* Chromes "Baggrundsgrafik" er slået FRA som standard, og uden dette printer
          brandfarve-båndet hvidt. Regel 7 siger båndet skal have den rå farve — så skal
          den også nå papiret. */
       -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* Links skal se ud som den tekst de står i. Browserens blå med understregning ville være
   det eneste blå på siden. Adressen følger stadig med i PDF'en og kan klikkes. */
a { color:inherit; text-decoration:none; }

/* Målestok: browseren fortæller selv hvor mange px der går på en millimeter.
   Hardkodede 794/1123 bager en afrundingsfejl ind som en linje for meget ved sideskiftet. */
#mm-probe { position:absolute; top:0; left:0; width:1mm; height:100mm; visibility:hidden; pointer-events:none; }

/* Siden ER indholdsboksen. Padding frem for @page-margin, se filens hoved. */
.side { width:210mm; height:297mm; padding:${v.padTop}mm ${v.padSide}mm ${v.padBund}mm;
        overflow:hidden; position:relative; background:#fff; }
.side + .side { break-before:page; }
/* Værn mod en tom tredje side: to sider à 297 mm fylder præcis to A4, og en enkelt
   afrundet subpixel er nok til at browseren bryder én gang for meget. */
.side:last-child { break-after:avoid-page; }

/* Kun på SKÆRM: to adskilte ark i stedet for ét langt dokument.
   Mellemrummet alene var ikke nok — body er hvid, så springet mellem to hvide sider var
   usynligt, og det hele lignede én lang side. Derfor får body en grå bund på skærmen (og
   KUN på skærmen; ved print skal papiret være hvidt), og hver side en kant og en skygge. */
@media screen {
  body { background:#8a8078; }
  .side { box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .side + .side { margin-top:8mm; }

  /*
    Når auto-tilpasningen ikke kan få det til at passe, sættes .for-lang på body.
    Uden den var overløbet USYNLIGT: .side klipper med overflow:hidden, så en side der er
    tre centimeter for lang, ser fuldstændig rigtig ud på skærmen — man læser "for langt"
    og kan ikke få øje på hvad der er for meget. Her spilder indholdet ud under den røde
    streg, som er dér papiret faktisk holder op.
  */
  body.for-lang .side { overflow:visible; }
  body.for-lang .side::after {
    content:"papiret slutter her — alt herunder kommer ikke med";
    position:absolute; left:0; right:0; bottom:0;
    border-top:1.5pt dashed #c0392b;
    font-family:${v.sans}; font-size:7pt; color:#c0392b;
    padding-top:1mm; text-align:right;
  }
}
/* flow-root og ikke ingenting: uden den kollapser det sidste barns bund-margen UD af
   .inner, og så måler auto-tilpasningen siden et par millimeter for kort. Det er lige
   præcis nok til at få en linje for meget med over på næste side. */
.inner { display:flow-root; }

/* hoved */
.hoved { display:flex; justify-content:space-between; align-items:flex-end; gap:8mm; }
.hoved > .titelblok { flex:1 1 auto; min-width:0; }
.navn { font-family:${v.sans}; font-size:${v.navn}pt; font-weight:700;
        letter-spacing:-.018em; line-height:1; white-space:nowrap; }
.rolle { font-family:${v.sans}; font-size:9.6pt; color:${v.brandText}; margin-top:2.4mm; }
.kontakt { font-family:${v.sans}; font-size:8.2pt; line-height:1.65;
           color:var(--muted); margin-top:${v.km}mm; }
.kontakt .staerk { color:var(--ink); }
.foto { width:${v.foto}mm; height:${v.foto}mm; object-fit:cover; border-radius:1mm; flex:0 0 auto; }
.baand { height:${v.baand}mm; background:${v.brand}; margin-top:${v.bm}mm; border-radius:.4mm; }

/* sektioner */
.sektion { margin-top:${v.sek}mm; }
.sektion > h2 { font-family:${v.sans}; font-size:7.4pt; font-weight:700;
  text-transform:uppercase; letter-spacing:.16em; color:${v.brandText};
  padding-bottom:1.6mm; margin-bottom:${v.h2}mm; border-bottom:.5pt solid var(--hair); }
.profil { font-size:${v.profil}pt; line-height:1.46; margin:${v.pm}mm 0 0 0; max-width:152mm; }

/* poster med datorende */
.post { display:flex; gap:${v.rendeGab}mm; margin-bottom:${v.post}mm; break-inside:avoid; }
.post:last-child { margin-bottom:0; }
.dato { flex:0 0 ${v.rende}mm; font-family:${v.sans}; font-size:8pt;
        color:var(--muted); padding-top:.9mm; }
.krop { flex:1; min-width:0; }
.post h3 { font-family:${v.sans}; font-size:10pt; font-weight:700; }
.hvor { font-size:8.8pt; color:var(--muted); font-style:italic; margin:.4mm 0 1.9mm 0; }
.jobnote { font-size:8.6pt; color:var(--muted); margin:-1.2mm 0 1.9mm 0; }
ul { list-style:none; }
li { position:relative; padding-left:4.2mm; margin-bottom:${v.li}mm; }
li:last-child { margin-bottom:0; }
li::before { content:"\\2014"; position:absolute; left:0; color:${v.brandText}; font-size:8pt; }

/* projekter */
.projekt-hoved { display:flex; align-items:baseline; gap:2.5mm; flex-wrap:wrap; }
.projekt-meta { font-family:${v.sans}; font-size:8pt; color:var(--muted); }
.projekt-tekst { margin-top:.6mm; }

/* reference inde i et job */
.post.har-ref { margin-bottom:${v.refspring}mm; }
.joberef { border-left:1.6pt solid ${v.brand}; padding:.6mm 0 .6mm 3.6mm;
           margin-top:${v.rm}mm; break-inside:avoid; }
.joberef .mrk { font-family:${v.sans}; font-size:6.8pt; font-weight:700;
                text-transform:uppercase; letter-spacing:.13em; color:${v.brandText}; }
.joberef .navn2 { font-family:${v.sans}; font-size:9.4pt; font-weight:700; margin-top:.8mm; }
.joberef .linje { font-size:8.8pt; color:#514a43; margin-top:.4mm; }

/* raekker med etiket i renden */
.raekke { display:flex; gap:${v.rendeGab}mm; margin-bottom:2.1mm; break-inside:avoid; }
.raekke .etiket { flex:0 0 ${v.rende}mm; font-family:${v.sans}; font-size:8pt;
                  color:var(--muted); padding-top:.3mm; }
.raekke .liste { flex:1; min-width:0; }
.raekke .liste b { font-size:9pt; }
.brik { font-family:${v.sans}; font-size:8.2pt; display:inline-block;
        padding:.5mm 2mm; margin:0 1mm 1mm 0; border:.5pt solid var(--hair);
        border-radius:1mm; color:#46403a; }
.ref { margin-bottom:2.6mm; break-inside:avoid; }
.ref .titel2 { font-size:8.8pt; color:var(--muted); }
.ref .mail { font-family:${v.sans}; font-size:8pt; color:var(--muted); }

/* side 2 */
.side2 .toplinje { display:flex; justify-content:space-between; align-items:baseline;
                   font-family:${v.sans}; font-size:8.5pt; color:var(--muted); }
.side2 .toplinje .n { color:var(--ink); font-weight:700; letter-spacing:-.01em; white-space:nowrap; }
.side2 .baand { height:${v.baand2}mm; margin-top:2mm; }
.omtekst p { margin-bottom:2.4mm; max-width:152mm; }
.omtekst p:last-child { margin-bottom:0; }
.udenfor { font-style:italic; color:#433d37; }
`;
