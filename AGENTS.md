# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# Delte primitiver — brug dem, byg dem ikke om

Kodebasen blev ryddet op (aug. 2026) fordi den samme kode var skrevet forfra i hver feature:
stores, repositories, formular-felter, slet-knapper. Abstraktionerne fandtes, men halvdelen af
features migrerede aldrig over på dem. **Det er den fejl der ikke må gentage sig.**

Regel: **søg efter en eksisterende primitiv, før du skriver en ny komponent, hook eller store.**
Findes mønstret anden gang, skal det udtrækkes — ikke kopieres.

## Data-laget

| Skal du… | Brug | Skriv ALDRIG |
|---|---|---|
| Læse en Firestore-kollektion | `createCollectionStore(key, subscribe, persistName?)` | egen `create()` + `onAuthStateChanged` + `start/stop` |
| Læse ét settings-/skabelon-dokument | `createDocStore({ key, persistName, subscribe, empty, map })` | samme boilerplate for ét doc |
| CRUD på `users/{uid}/<kollektion>` | `createUserCollectionRepo({ collection, orderBy, createdToast })` | egen `requireUid` + sti-par + subscribe/create/update/delete |
| Have brugerens uid | `requireUid()` fra `@/lib/firebase/require-uid` | en lokal kopi |
| Bulk-skrive | `db.commitBatch(ops)` | `Promise.all` af enkelt-writes |
| Fjerne `undefined` før en write | `omitUndefined()` fra `@/lib/firebase/omit-undefined` | egen `stripUndefined` |

**Lister læses ALTID med `store.useVisibleItems()`.** `items` er med vilje ikke i den offentlige
selector-type, så `useXStore((s) => s.items)` er en compile-fejl. Grunden: en optimistisk slettet
post skal være væk fra skærmen, mens fortryd-vinduet kører. Skal du undtagelsesvis bruge den rå
liste (fx dubletkontrol ved import), hedder det `useAllItems()` / `getAllItems()` — og så skal det
begrundes i en kommentar.

⚠️ `useVisibleItems()` returnerer storens EGEN array når intet er pending (stabil reference til
`useMemo`-deps). **Kopiér før `sort()`**: `[...items].sort(…)`.

Én post: `store.useItem(id)` — `id` må være `undefined`, så kaldet aldrig pakkes i en betingelse.

## Sletning

**ALLE sletninger: bekræftelses-alert + fortryd. Uanset hvor lille entiteten er.**
Der er ikke længere en "for lille til at bekræfte"-kategori.

- Detalje-skærm → `<DeleteEntityLink id label name pending remove />` (navigerer tilbage selv)
- Række i en liste → `<DeleteRowButton id title name pending remove />`
- Noget helt tredje → `confirmDelete({ … })` direkte
- Kan handlingen ikke udskydes (nulstillinger) → `writeWithUndo({ write, restore })`

`pending` er `useXStore.pending` — storen ejer sit eget fortryd-vindue. Repositories toaster
**ikke** ved sletning; fortryd-toasten er kvitteringen.

Undtaget: at fjerne en række i en formular man er i gang med at udfylde (ikke en gemt entitet).

## Tavse tab — den dyreste fejlklasse

En gennemgang af CV-featuren (aug. 2026) fandt 14 fejl. **Tolv af dem var samme slags: data
forsvandt, og appen sagde "Gemt".** Ingen af dem gav en fejlmeddelelse, en rød ramme eller et
tomt felt man kunne se. Derfor står de her, som regler og ikke som anekdoter.

**Grundreglen: hver gang koden filtrerer, udelader eller omformer noget brugeren har tastet,
skal der enten stå det på skærmen eller være en valideringsfejl der spærrer for Gem.**
Et `.filter()` uden en tilsvarende `issue()` er en fejl der venter.

### Formularer skal vente på deres data

Mønstret `const current = values ?? fraStore(...)` fryser ved FØRSTE tastetryk. Er storen ikke
hentet endnu, fryser formularen ved tomme felter — og Gem skriver dem oven i det rigtige
dokument. Ét tegn i ét felt er nok.

- Gate på `loading` (`<LoadingScreen />`) **før** formularen tegnes. Gælder også
  `createDocStore`-skærme, ikke kun kollektioner.
- Dubletkontrol mod en liste (`snapshot[coll][slug]`) er kun sand når listen ER hentet. En tom
  store ser ud som "id'et er ledigt". Læg `loading` i din `problems`-liste, så Gem er spærret.

### `merge: true` + "udelad tomme felter" = felter kan ikke ryddes

Hver for sig fornuftige. Sammen betyder de at det man rydder, aldrig bliver ryddet: skriveren
udelader feltet, og merge lader den gamle værdi stå. Firestore fletter også ind i NESTEDE maps,
så `{person: {navn}}` over `{person: {navn, foto}}` beholder `foto`.

Skriver du et helt dokument fra en formular: **`merge: false`**. Reservér `merge: true` til
delvise skrivninger, og skriv i en kommentar hvorfor kaldet er delvist.

### Andet der forsvinder i tavshed

- **`orderBy` udelader dokumenter der mangler feltet.** En post skrevet uden `orden` kommer
  aldrig tilbage fra listeneren: usynlig i appen, usynlig i eksporten, til stede i databasen.
  Sortér i UI'et med mindre appen selv garanterer feltet (fx `createdAt` den altid sætter).
- **Bogholderi-felter appen selv sætter, skal med i sammenlignings-undtagelserne.** Tilføjer du
  et `importId`/`syncedAt`/lignende, så føj det til den liste der ignoreres ved diff og eksport —
  ellers står hver post som "afviger" på grund af et felt brugeren aldrig har set.
- **Id'er fra en fil skal valideres før de bliver Firestore-stier.** Et `/` gør stien til en
  kollektion → `doc()` kaster → hele batchen kører ikke. Én dårlig nøgle vælter alt.
- **`type: 'update'` i en batch afviser HELE batchen hvis ét dokument mangler.** Filtrér til de
  id'er du faktisk har set i snapshottet.
- **`toastAfter` fanger ikke fejlen — den returnerer det samme afvisende promise.** `void gem()`
  med `try/finally` uden `catch` giver en ubehandlet rejection. Skriv `catch {}` med en kommentar
  om at toasten allerede har sagt til.
- **Link aldrig til en rute der ikke findes endnu.** En `[param]`-rute ved siden af sluger den,
  guarden afviser, og `<Redirect>` sender brugeren tilbage til den side hen står på — en knap der
  genindlæser siden. Byg skærmen, eller lad linket være ude.

### Verifikation af ren logik

Rene funktioner køres i Node — men **oversæt den RIGTIGE kildekode** (`tsc --outDir` af de
faktiske filer + stubs for `@/lib/*`), aldrig en håndport. En håndport tester din læsning af
koden, ikke koden. Se `AGENTS.md`-historikken: en håndport gav et "fejlet" resultat der viste sig
kun at være portens egen unøjagtighed.

## UI

| Mønster | Primitiv |
|---|---|
| Tekst-/beløbsfelt i react-hook-form | `<ControlledField control name label? money? multiline? />` |
| Titel + "Tilføj"-knap øverst | `<ScreenHeader title addHref>` |
| Tom/indlæser-tilstand for en liste | `<ListGate count loading empty>` |
| Hel skærm der venter på data | `<LoadingScreen />` |
| Dialog | `<ModalSheet visible onClose>` |
| Forslags-dropdown | `<DropdownList>` + `useDropdownKeyboard()` |
| Etiket/værdi-linje | `<StatRow label>` |
| Web-only feature på native | `<WebOnlyScreen title description />` |
| Flerlinjet felt der skal vokse med teksten | `<Input multiline autoGrow className="h-auto min-h-20" />` |

`autoGrow` sætter `field-sizing: content` på web, så feltet er præcis så højt som indholdet i
stedet for at rulle i en lille kasse. Behold en `min-h-*`-klasse som gulv. Virker fordi
react-native-web sender ukendte style-nøgler videre til DOM'en; på native gør flaget ingenting.
Brug det IKKE på felter man paster store blobs i (JSON-import) — de skal have fast højde.

Navigationens indhold (begge skaller) står ét sted: `src/constants/features.ts`.
Rå hex-farver i JS: `src/constants/theme.ts` — ellers className.

⚠️ **Z-index i dropdowns**: det dynamiske løft bor hos den enkelte picker, ikke i
`DropdownList`. Flyt det ikke. Se [[dropdown-zindex]] i memory.

## Kvalitetsport

- `npm run typecheck` skal være grøn. `npm run typecheck:unused` fanger efterladte imports.
- Kør IKKE `expo export` som verifikation — for langsomt.
- `src/app/**` er TYNDE ruter: en 1-linjes re-eksport, eller læs params og send som prop.
  Ingen formularer, ingen forretningslogik.
- Blød grænse ~150 linjer pr. fil, hård ~250 → split før du overskrider.
