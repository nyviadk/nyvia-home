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
