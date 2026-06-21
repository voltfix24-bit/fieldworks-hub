## Doel

De tekenmodus op mobiel zo inrichten dat het canvas het volledige scherm vult. Bediening en details verschijnen als zwevende overlays bovenop het canvas — niet als vaste balken die ruimte afpakken. Detailpaneel verschijnt alleen wanneer er iets is geselecteerd (elektrode of MSR-kast). Tikken op een lege plek op het canvas verbergt het paneel weer.

## Wat verandert

### 1. Full-screen canvas

In `src/features/msr-diagram/MSRDiagramCanvas.tsx`:

- Canvas-container wordt `absolute inset-0` (vult het hele scherm), geen marges of border-radius op mobiel.
- Header (Terug + titel + Toevoegen + Opslaan) wordt een zwevende balk bovenop het canvas: `absolute top-0`, witte pill-achtige knoppen met schaduw, zodat hij niet meer als een hoge blok ruimte inneemt.
- Zoomcontrols blijven rechtsonder zweven.
- Het bestaande `bg-[#f4f8f7]` raamwerk + onderliggend `flex-col` vervalt op mobiel; alles ligt over het canvas.

### 2. Selectie van de MSR-kast

Op dit moment is alleen een elektrode selecteerbaar. We breiden de selectie uit:

- Eén gedeelde state `selection: { kind: 'electrode', id } | { kind: 'cabinet' } | null`.
- `Canvas.tsx`: bij `onPointerDown` op het kast-rechthoek roepen we een nieuwe callback `onSelectCabinet()` aan; bij pointerdown op leeg canvas (huidige `e.target === e.currentTarget`) blijft `onSelect(null)` — dit deselecteert alles en verbergt het paneel.
- Elektrode-tap zet selectie naar die elektrode.

### 3. Detailpaneel als bottom sheet

`Toolbar.tsx` wordt herschreven naar een floating bottom sheet:

- Geen `<details>`-uitklap meer, geen lege/inklap-staat onderaan.
- Component rendert alleen iets als er een selectie is.
- Bij `selection.kind === 'cabinet'`: paneel met "MSR / kast" titel + Naam/nummer-veld + Deurzijde-selector.
- Bij `selection.kind === 'electrode'`: huidige label / verwijder / referentiehoek / H / V-velden.
- Paneel zit `absolute bottom-0`, met witte achtergrond, ronde bovenhoeken, schaduw en `safe-area-inset-bottom` padding.
- Een kleine "X" rechtsboven in het paneel sluit het ook (zet selectie op `null`).

### 4. Lege-tap verbergt paneel

De bestaande pointerdown op de lege canvas-achtergrond (`onSelectElectrode?.(null)`) wordt uitgebreid naar de nieuwe gecombineerde `onSelect(null)` zodat ook een cabinet-selectie wordt opgeheven. Geen wijziging nodig aan drag-gedrag.

### 5. Bestaand drag/zoom-gedrag intact

- Dragging elektrodes en kast blijft werken (PointerDown-handlers blijven hetzelfde, alleen selectiestate verandert).
- Zoomcontrols, "Selecteer referentiepunt"-overlay en opslagflow blijven ongewijzigd.

## Technische details

Bestanden die ik raak:

- `src/features/msr-diagram/MSRDiagramCanvas.tsx` — layout omgooien naar full-screen + floating header + selection-state uitbreiden.
- `src/features/msr-diagram/Canvas.tsx` — extra `onSelectCabinet` prop; pointerdown op kast roept hem aan; `onSelect(null)` heet generieker.
- `src/features/msr-diagram/Toolbar.tsx` — herschrijven naar conditioneel floating bottom-sheet met twee varianten (kast / elektrode) en sluitknop.

Geen wijzigingen aan database, PNG-export of opslag-logica.

## ASCII-schets

```text
┌────────────────────────────┐
│ [<]  Schets    [+] [opslaan]│  ← floating top bar
│                            │
│                            │
│      ┌─────┐               │
│      │ MSR │ ── H 8,9 m ── │  ← canvas vult alles
│      │     │               │
│      └─────┘   ⏚ Elektrode │
│                            │  ← niets geselecteerd: geen bottom panel
└────────────────────────────┘

Na tap op elektrode:
┌────────────────────────────┐
│ [<]  Schets    [+] [opslaan]│
│                            │
│      ┌─────┐               │
│      │ MSR │               │
│      └─────┘   ⏚ (sel)     │
│ ┌────────────────────── X ┐│  ← floating detail sheet
│ │ Elektrode 1  [trash]    ││
│ │ Hoek: LB RB LO RO       ││
│ │ H [   ]   V [   ]       ││
│ └─────────────────────────┘│
└────────────────────────────┘
```
