# Styling und Barrierefreiheit

Dieses Dokument beschreibt die SCSS-Struktur, das responsive Verhalten und den Stand der Barrierefreiheit des finalen **Join**-Projekts. Es ersetzt die früher getrennten Entwürfe zum SCSS-/Responsive-Aufbau und zu Accessibility/UX.

Die Datei dokumentiert sowohl verbindliche Entwicklungsregeln als auch den tatsächlich vorhandenen Implementierungsstand. Sie ist keine Behauptung einer vollständigen WCAG-Konformität.

Allgemeine Code-Regeln stehen unter [Code-Konventionen](conventions.md). Formularvalidierung und Fehlerzuordnung werden unter [Formulare und Validierung](../features/forms-validation.md) beschrieben.

## Grundprinzip

Styling wird so lokal wie möglich und so global wie nötig gehalten:

```text
Regel betrifft nur eine Component
    ↓
Component-SCSS

Regel wird von mehreren Bereichen stabil geteilt
    ↓
globale SCSS-Struktur

Regel verändert Layout, Breakpoints oder Basiselemente
    ↓
Teamabstimmung vor der Änderung
```

Barrierefreiheit ist dabei keine reine CSS-Aufgabe. Sie entsteht gemeinsam aus:

- semantischem HTML
- Tastaturverhalten
- verständlichen Zuständen und Meldungen
- passenden ARIA-Attributen
- sichtbaren Fokuszuständen
- ausreichend robustem responsive Verhalten
- TypeScript-Logik für Menüs, Dialoge und alternative Interaktionen

Eine Oberfläche gilt nicht allein deshalb als responsive oder zugänglich, weil sie auf einem Screenshot korrekt aussieht.

## Verantwortlichkeiten

| Bereich | Zuständigkeit |
| --- | --- |
| `src/styles.scss` | globaler Einstiegspunkt |
| `src/styles/abstracts/` | Design-Tokens, Breakpoints und Mixins |
| `src/styles/base/` | Reset und Basistypografie |
| `src/styles/components/` | bewusst gemeinsam verwendete Basisklassen |
| `src/styles/pages/` | wenige globale, seitenbezogene Variablen |
| Component-SCSS | konkretes Layout, responsive Verhalten und Interaktionszustände einer Component |
| Component-Template | Semantik, Labels, ARIA-Verknüpfungen und native Interaktionselemente |
| Component-TypeScript | Öffnen, Schließen, Tastaturereignisse, Scroll-Lock und andere UI-Abläufe |

Eine Feature-Component verändert keine globale Sidebar-, Header- oder Reset-Regel, um einen lokalen Darstellungsfehler zu verdecken.

## Aktive globale SCSS-Struktur

Angular lädt:

```text
src/styles.scss
    ↓
src/styles/main.scss
```

`src/styles.scss` enthält ausschließlich:

```scss
@use './styles/main';
```

Der aktive globale Einstieg bindet derzeit ein:

```scss
@use './abstracts/variables';
@use './abstracts/mixins';
@use './abstracts/breakpoints';

@use './base/reset';
@use './base/typography';

@use './components/buttons';
@use './components/forms';
@use './components/badges';
@use './components/dialogs';

@use './pages/contacts';
```

Damit ist die vorhandene Struktur nur teilweise befüllt:

| Datei oder Bereich | Finaler Stand |
| --- | --- |
| `abstracts/_variables.scss` | aktiv; globale CSS Custom Properties |
| `abstracts/_breakpoints.scss` | aktiv; Sass-Breakpoints |
| `abstracts/_mixins.scss` | aktiv; wiederverwendete Layout-Mixins |
| `abstracts/_functions.scss` | vorhanden, derzeit ohne Regeln |
| `base/_reset.scss` | aktiv |
| `base/_typography.scss` | aktiv |
| `base/_base.scss` | vorhanden, derzeit ohne Regeln |
| `components/_buttons.scss` | aktiv |
| `components/_forms.scss` | aktiv |
| `components/_badges.scss` | aktiv |
| `components/_dialogs.scss` | aktiv |
| `components/_cards.scss` | vorhanden, derzeit ohne Regeln |
| `pages/_contacts.scss` | aktiv; wenige Kontaktvariablen |
| weitere `pages/`-Dateien | vorhanden, derzeit ohne Regeln |
| `layout/`, `themes/`, `utilities/`, `vendors/` | vorbereitet, aber im finalen Stand nicht aktiv ausgebaut |

Die Ordnerstruktur ist damit kein Beleg dafür, dass bereits jede Ebene einer vollständigen 7–1-Architektur verwendet wird. Leere Scaffold-Dateien werden nicht mit spekulativen Regeln gefüllt.

## Sass-Auflösung

In `angular.json` ist festgelegt:

```json
"stylePreprocessorOptions": {
  "includePaths": [
    "src/styles"
  ]
}
```

Component-Dateien können globale Abstracts deshalb ohne lange relative Pfade laden:

```scss
@use 'abstracts/breakpoints' as bp;
@use 'abstracts/mixins' as mx;
```

Diese Konfiguration wirkt auf das gesamte Projekt und wird nur nach Teamabstimmung geändert.

## Design-Tokens

Globale Werte, die auch zur Laufzeit über die CSS-Kaskade benötigt werden, liegen als Custom Properties unter `:root`.

### Farben

Der zentrale Satz enthält unter anderem:

```scss
:root {
  --color-bg-main: #f6f7f8;
  --color-bg-light: #ffffff;
  --color-primary: #2a3647;
  --color-primary-dark: #091931;
  --color-primary-hover: #29abe2;
  --color-text-main: #000000;
  --color-text-light: #ffffff;
  --color-text-muted: #6b6b6b;
  --color-border-light: #d1d1d1;
  --color-border-focus: #29abe2;
  --color-error: #e60026;
  --color-link: #007cee;
}
```

Feature-spezifische Farben bleiben lokal, wenn kein stabiler gemeinsamer Anwendungsfall besteht. Dazu gehören beispielsweise:

- Task-Kategoriefarben
- Prioritätsfarben
- spezielle Hover-Farben eines Menüs
- einzelne Dialoghintergründe
- dynamische Kontakt-Badge-Farben

Eine Farbe wird nicht allein deshalb globalisiert, weil sie optisch an zwei Stellen vorkommt.

### Typografie

Global definiert sind:

- `--font-primary`
- abgestufte Schriftgrößen
- `--line-height-base`
- responsive Grundgrößen für `h1`, `h2` und `h3`

Components dürfen davon abweichen, wenn das Figma-Layout oder die verfügbare Fläche eine klar begründete lokale Größe erfordert.

### Layoutwerte

Gemeinsam verwendet werden unter anderem:

```text
--layout-max-width: 1440px
--layout-header-height: 96px
--layout-mobile-header-height: 80px
--layout-mobile-bottom-nav-height: 80px
--layout-mobile-landscape-header-height: 64px
--layout-mobile-landscape-bottom-nav-height: 72px
--contact-sidebar-width: 232px
--contact-list-width: 424px
```

Page-SCSS leitet daraus bei Bedarf lokale Variablen ab:

```scss
.board-page {
  --board-header-height: var(--layout-mobile-header-height);
  --board-bottom-nav-height: var(--layout-mobile-bottom-nav-height);
}
```

So bleiben die allgemeinen Maße zentral, während die konkrete Verwendung beim Feature sichtbar bleibt.

### Radien, Schatten und Übergänge

Globale Tokens existieren für:

- kleine, mittlere und große Radien
- vollständig runde Elemente
- Dialogradien
- Header-, Sidebar-, Listen-, Avatar- und Overlay-Schatten
- die kurze Standardtransition

Lokale Animationen verwenden zusätzlich eigene Zeiten, wenn sie Teil eines konkreten Dialog- oder Overlay-Ablaufs sind.

## Sass-Variablen und CSS Custom Properties

Join trennt zwei Arten von Werten:

| Typ | Verwendung |
| --- | --- |
| Sass-Variable | Compile-Time-Wert, insbesondere Breakpoints |
| CSS Custom Property | kaskadierbarer Laufzeitwert für Farben, Maße und lokale Ableitungen |

Beispiel:

```scss
@media (max-width: bp.$breakpoint-tablet-xl) {
  .header {
    height: var(--layout-mobile-header-height);
  }
}
```

Sass-Arithmetik wird eindeutig interpoliert, wenn sie innerhalb einer Media Query benötigt wird:

```scss
@media (
  min-width:
    calc(#{bp.$breakpoint-tablet-xl} + 1px)
) {
  // Wide layout
}
```

## Mixins

Die aktiven Mixins decken wenige wiederkehrende Muster ab:

| Mixin | Zweck |
| --- | --- |
| `flexbox()` | Flex-Layout mit Richtung, Ausrichtung und Verteilung |
| `page-container` | begrenzter Seitencontainer |
| `column-layout` | einfaches Spaltenlayout |
| `card-desc()` | mehrzeilige Textbegrenzung für Karten |

Beispiel:

```scss
@include mx.flexbox(row, space-between, center);
```

Ein Mixin wird nur ergänzt, wenn es eine wiederkehrende Regel verständlicher macht. Ein einmaliger Block wird nicht allein zur Reduzierung von Zeilen ausgelagert.

## Component-SCSS

Component-spezifische Styles liegen direkt bei Template und TypeScript:

```text
task-card.ts
task-card.html
task-card.scss
```

Sie sind zuständig für:

- internes Component-Layout
- lokale Abstände und Größen
- responsive Änderungen der Component
- Hover-, Focus-, Active- und Disabled-Zustände
- lokale Animationen
- Feature-spezifische Scrollbereiche
- lokale Dialog- und Menüdarstellung

Große Component-Dateien dürfen in benannte Partials zerlegt werden:

```scss
@use 'add-task-layout';
@use 'add-task-fields';
@use 'add-task-subtasks';
@use 'add-task-responsive';
```

Das ist eine mögliche lokale Strukturierung und keine Aufforderung, alle vorhandenen Styles nachträglich umzubauen. Im finalen Projekt bleiben mehrere umfangreiche Component-SCSS-Dateien bewusst lokal.

## Klassenbenennung und Nesting

Die meisten Feature-Styles folgen einer BEM-ähnlichen Benennung:

```text
task_card
task_card__progress
task_card__move_menu

contact-dialog
contact-dialog__field
contact-dialog--closing
```

Die vorhandene Codebasis verwendet sowohl Bindestriche als auch Unterstriche. Innerhalb einer bestehenden Component wird deren lokales Muster fortgeführt. Eine projektweite Umbenennung nur zur optischen Einheitlichkeit ist kein kleiner Stylingfix.

Nesting bleibt auf die Component und ihre direkten Elemente begrenzt:

```scss
.task_card {
  &__title {
    font-weight: 700;
  }

  &--active {
    background-color: var(--color-primary);
  }
}
```

Mehrere tief verschachtelte Strukturselektoren werden vermieden, weil sie:

- die Spezifität unnötig erhöhen
- Overrides erschweren
- Template-Struktur und Styling zu stark koppeln
- responsive Anpassungen unübersichtlich machen

## Globale Basisklassen

### Buttons

Die globale `.button`-Klasse stellt bereit:

- Inline-Flex-Ausrichtung
- Mindesthöhe und Innenabstand
- Radius und Typografie
- gemeinsame Übergänge
- Disabled-Darstellung

Varianten:

```text
.button-primary
.button-clean
```

Feature-spezifische Größen und Layoutanpassungen werden lokal ergänzt:

```scss
.add-task__create-button {
  min-height: 48px;
  padding: 10px 16px;
}
```

### Formulare

Die globalen Klassen:

```text
.form-field
.form-input
.form-input--invalid
.form-error
```

bilden die gemeinsame Basis der Kontaktformulare.

Sie definieren:

- Eingabehöhe und Innenabstand
- Standard-, Fokus- und Fehlerborder
- Placeholder-Farbe
- reservierten Platz für Fehlertexte

Add Task, Auth und der Board-Dialog besitzen zusätzliche lokale Formularregeln, weil Aufbau und Größen deutlich abweichen.

### Badges

Globale Avatar-Badges stellen gemeinsame Form, Rahmen, Textausrichtung und Schatten bereit. Die tatsächliche Hintergrundfarbe kommt aus dem Kontaktdatensatz.

Auf Task-Karten werden höchstens drei Kontakte direkt dargestellt. Weitere Kontakte erscheinen als `+N`-Badge, damit die Karte nicht überläuft.

### Dialogbasis

Die globalen Klassen `.dialog-backdrop` und `.dialog-card` liefern eine einfache Basisschicht.

Die produktiven Kontakt-, Task- und Add-Task-Dialoge verwenden wegen ihrer unterschiedlichen Layouts überwiegend eigene Component-Klassen. Diese Abweichung ist beabsichtigt; ein vorschnelles Zusammenziehen in eine große globale Dialogklasse würde die responsive Speziallogik verdecken.

## Breakpoints

Die zentralen Sass-Werte lauten:

| Variable | Wert |
| --- | ---: |
| `$breakpoint-mobile-s` | `320px` |
| `$breakpoint-mobile-xs` | `360px` |
| `$breakpoint-mobile-m` | `480px` |
| `$breakpoint-mobile-l` | `640px` |
| `$breakpoint-tablet-sm-max` | `799px` |
| `$breakpoint-tablet-sm` | `800px` |
| `$breakpoint-tablet-l` | `960px` |
| `$breakpoint-tablet-xl` | `1120px` |
| `$breakpoint-desktop-s` | `1280px` |
| `$breakpoint-desktop-fhd` | `1440px` |
| `$breakpoint-landscape-height-sm` | `420px` |
| `$breakpoint-landscape-height-md` | `620px` |
| `$breakpoint-landscape-width-md` | `900px` |
| `$breakpoint-landscape-width-lg` | `1024px` |

Nicht jede Component verwendet jeden Breakpoint. Die Werte bilden einen gemeinsamen Satz, aus dem ein Feature die tatsächlich benötigten Grenzen auswählt.

## Wichtige responsive Grenzen

Es existiert nicht eine einzige allgemeine Mobile-Grenze für alle Abläufe.

| Grenze | Bedeutung im finalen Projekt |
| --- | --- |
| bis `798px` | echter mobiler Board-Ablauf; unter anderem Add Task als Route und kein CDK-Drag auf Karten |
| bis `799px` | einspaltiges Add-Task-Formular und vollflächige Add-Task-Dialogregeln |
| bis `1120px` | kompakter Header, untere Navigation, schmale Seitenlayouts und horizontale Board-Spalten |
| ab `1121px` | feste Sidebar, großer Header und breites Seitenlayout |
| bis `1280px` | Kontakt-Dialog wechselt bereits in eine kompaktere einspaltige Darstellung |
| maximal `1024px` breit und `620px` hoch | spezielle Landscape-Regeln |

Die frühere Aussage „bis 799px mobile Navigation, ab 800px Sidebar“ entspricht nicht dem finalen Code. Sidebar und untere Navigation wechseln bei `1120/1121px`.

## Responsive Strategie

Die Codebasis enthält abhängig von der Component sowohl Desktop- als auch Mobile-orientierte Basen. Entscheidend ist eine nachvollziehbare Reihenfolge innerhalb der Datei:

```text
Basisdarstellung
    ↓
mittlere Breiten
    ↓
schmale Breiten
    ↓
sehr schmale Breiten
    ↓
Landscape-Sonderfall
```

Neue Regeln werden nicht zwischen bereits getrennte Breakpoint-Blöcke verstreut, wenn sie sich fachlich zusammenhalten lassen.

Responsive Maße verwenden bevorzugt:

- `min()`
- `max()`
- `clamp()`
- flexible Grid-Spalten
- `minmax(0, 1fr)`
- `min-width: 0`
- `min-height: 0`
- `100dvh` und `100dvw` bei viewportgebundenen Oberflächen

`min-width: 0` und `min-height: 0` sind besonders wichtig, wenn ein verschachteltes Flex- oder Grid-Kind selbst scrollen soll.

## Seitenlayout

### Breites Layout ab 1121px

Die großen Anwendungsseiten verwenden:

- feste Sidebar mit `232px`
- Header mit `96px`
- keinen unteren Navigationsabstand
- verbleibenden Inhalt als flexiblen Hauptbereich

Die Sidebar nimmt ihre Breite über `flex-basis` ein. Der rechte Bereich verwendet `min-width: 0`, damit Inhalte nicht über die verfügbare Breite hinausdrücken.

### Schmale Layouts bis 1120px

Auf schmaleren Viewports:

- wird dieselbe Sidebar-Component als untere Navigation dargestellt
- verwendet der Header die kompakte Höhe von `80px`
- reserviert die Page unten Platz für die Navigation
- werden breite Mehrspaltenansichten umgebaut
- verschwinden rechtliche Sidebar-Links aus der unteren Navigation

Bei maximal `360px` wird die Navigationshöhe auf `72px` reduziert.

### Landscape

Bei geringer Höhe und maximal `1024px` Breite gelten eigene Variablen:

```text
Header: 64px
untere Navigation: 72px
```

Kontakt- und Add-Task-Dialoge ordnen ihre Inhalte in Landscape erneut zweispaltig an, damit Aktionen und Eingaben erreichbar bleiben.

## Header und Navigation

Der Header:

- zeigt im breiten Layout den Seitentitel
- zeigt bis `1120px` stattdessen das kompakte Join-Logo
- blendet den separaten Help-Link im kompakten Layout aus
- stellt Help dort innerhalb des Profilmenüs bereit
- schließt das Profilmenü bei Außenklick und Escape

Die Sidebar:

- verwendet echte Router-Links
- markiert die aktive Route über `routerLinkActive`
- besitzt eigene Hover- und Fokuszustände
- wird bis `1120px` zu einer horizontalen unteren Navigation

Die aktive Navigation wird nicht ausschließlich durch Textfarbe angezeigt. Sie erhält zusätzlich einen dunkleren Hintergrund.

## Board-Layout

### Breites Board

Ab `1121px`:

- stehen vier Statusspalten in einem Grid
- scrollt jede Spalte vertikal in ihrem eigenen Inhaltsbereich
- bleiben Board-Header und Spaltenüberschriften außerhalb des Karten-Scrollbereichs
- verwendet jede Karte die verfügbare Spaltenbreite bis maximal `252px`

### Board bis 1120px

Bis `1120px`:

- stehen die Statusbereiche untereinander
- liegen die Karten innerhalb einer Statusspalte horizontal
- scrollt jede Kartenreihe horizontal
- sind Scroll-Snap und Touch-Scrolling aktiv
- werden sichtbare Scrollbars verborgen
- kann die Reihe zusätzlich per Maus-Pointer-Geste verschoben werden

Die CDK-Drop-Listen verwenden in diesem Bereich eine horizontale Orientierung.

### Mobiler Board-Ablauf bis 798px

Bis `798px`:

- wird klassisches CDK-Drag auf Karten deaktiviert
- öffnet Add Task als eigene Route
- steht das Move-Menü der Task-Karte als Statusalternative zur Verfügung

Diese fachliche Grenze wird im `BoardHorizontalScrollService` verwaltet. Sie ist nicht identisch mit dem CSS-Wechsel des Seitenlayouts.

Details stehen unter [Tasks und Board](../features/tasks-board.md).

## Kontakte

Ab `1121px` stehen Kontaktliste und Detailansicht nebeneinander:

```text
Sidebar
    +
Kontaktliste mit 424px
    +
flexible Detailansicht
```

Bis `1120px`:

- verwendet die Liste zunächst die gesamte Breite
- wird sie nach Auswahl eines Kontakts ausgeblendet
- erscheint die Detailansicht als eigene Vollansicht
- führt ein Zurück-Button wieder zur Liste
- ersetzt ein mobiles Aktionsmenü die dauerhaft sichtbaren Edit-/Delete-Aktionen
- ersetzt ein Floating Action Button den großen Add-Contact-Button

Nur die Kontaktliste besitzt einen eigenen vertikalen Scrollbereich. Lange Namen und E-Mail-Adressen werden mit Ellipsis begrenzt.

## Add Task

Das Formular verwendet im breiten Layout zwei Spalten mit einem visuellen Trenner.

Bis `799px`:

- werden die Formularspalten untereinander angeordnet
- wird der Trenner ausgeblendet
- bleibt die Aktionsleiste am unteren Rand sticky
- wird die Pflichtfeldlegende zugunsten der verfügbaren Fläche ausgeblendet

In Landscape wird das zweispaltige Formular bei geringer Höhe wiederhergestellt, während die Aktionsleiste sticky bleibt.

Das Add-Task-Formular wird sowohl als Seite als auch innerhalb des Add-Task-Dialogs verwendet. Der Modifikator `add-task--dialog` begrenzt den Formularbereich und gibt ihm einen eigenen vertikalen Scrollbereich.

## Auth-Seiten

Login und Registrierung besitzen ein eigenständiges, zentriertes Kartenlayout:

- maximale Seitenbreite
- flexible vertikale Aufteilung
- responsive Innenabstände
- visuell versteckte Labels
- reservierte Fehlerbereiche
- untereinander angeordnete Aktionen auf schmalen Viewports

Auth-Seiten verwenden lokale Variablen, weil ihre Formdarstellung nicht vollständig mit Add Task oder Kontaktdialogen übereinstimmt.

## Scroll- und Overflow-Konzept

Die Hauptseiten verwenden überwiegend eine feste Viewporthöhe:

```scss
height: 100dvh;
overflow: hidden;
```

Scrollen wird anschließend dem Bereich zugewiesen, der inhaltlich wachsen darf:

| Bereich | Scrollverhalten |
| --- | --- |
| Kontaktseite | Kontaktliste scrollt vertikal |
| Board ab 1121px | Kartenbereich jeder Spalte scrollt vertikal |
| Board bis 1120px | Page scrollt vertikal, Kartenreihen scrollen horizontal |
| Add-Task-Seite | Inhaltsbereich scrollt vertikal |
| Task-Dialog | mittlerer Inhalt scrollt, Header und Aktionen bleiben stehen |
| kompakter Kontakt-Dialog | Formularinhalt scrollt, Aktionen bleiben in eigener Zeile |
| Add-Task-Dialog | Formularbereich scrollt innerhalb des Dialograhmens |

Ziel ist:

```text
Header und Navigation bleiben erreichbar
    ↓
nur wachsender Inhalt scrollt
    ↓
Dialogaktionen bleiben sichtbar
```

`100vw` oder `100dvw` wird nicht unkontrolliert in verschachtelten Layouts ergänzt, weil dadurch zusammen mit Scrollbars horizontaler Überlauf entstehen kann.

## Body-Scroll-Lock

Bei geöffneten Dialogen wird der Hintergrund gesperrt.

Im Kontaktbereich geschieht dies über:

```scss
body.dialog-open {
  overflow: hidden;
}
```

Die Contacts-Page fügt die Klasse beim Öffnen hinzu und entfernt sie:

- beim Schließen
- nach dem letzten offenen Kontaktdialog
- in `ngOnDestroy()`

Add-Task- und Board-Dialog speichern dagegen die vorherigen Inline-Overflow-Werte von `body` und `html`, setzen beide auf `hidden` und stellen die gespeicherten Werte beim Zerstören wieder her.

Diese beiden vorhandenen Strategien werden nicht innerhalb eines einzelnen Dialogablaufs vermischt.

## Dialogaufbau

### Add-Task-Dialog

Der Add-Task-Dialog verwendet:

- ein festes Overlay
- ein natives `<dialog open>`
- `aria-modal="true"`
- `aria-labelledby`
- einen visuell versteckten Dialogtitel
- einen eindeutig beschrifteten Close-Button
- begrenzte Höhe relativ zu `100dvh`
- Scroll-Lock für Seite und Dokument

Bis `799px` wird der Dialog vollflächig. Im tatsächlichen mobilen Board-Ablauf wird Add Task jedoch als eigene Route geöffnet.

### Board-Task-Dialog

Der Task-Dialog verwendet ein dreizeiliges Grid:

```text
Header
scrollbarer Inhalt
Aktionsleiste
```

Im Edit-Modus liegt das Formular über dem mittleren und unteren Gridbereich. Nur der Formularinhalt scrollt; die Speichern-Aktion bleibt separat erreichbar.

Der Dialog:

- verwendet ein natives `<dialog open>`
- besitzt `aria-modal` und eine zugeordnete Überschrift
- blockiert Schließen während des Speicherns
- blockiert kollidierende Aktionen während Speichern oder Löschen
- schließt lokale Menüs bei Außenklick oder Escape

### Kontaktdialoge

Der Create-Dialog bildet die gemeinsame SCSS-Basis. Der Edit-Dialog bindet diese Basis über `@use` ein und ergänzt nur seine Abweichungen.

Auf breiten Viewports bestehen die Dialoge aus:

- dunkler Informationsseite
- Formularseite
- Avatar zwischen Informations- und Formularbereich

Bis `1280px` wechseln sie in ein kompaktes einspaltiges Dialoglayout. Formularinhalt und Aktionen sind dabei getrennte Gridzeilen. In Landscape wird eine platzsparende zweispaltige Variante verwendet.

## Overlay- und Layer-Struktur

Das Projekt besitzt derzeit keine vollständig tokenisierte Z-Index-Skala. Die aktiven Werte bilden dennoch eine erkennbare Reihenfolge:

| Ebene | Beispielwert |
| --- | ---: |
| normaler Inhalt | Standard-Stacking |
| Header innerhalb einer Page | `20` bis `50` |
| lokales Dropdown oder Menü | etwa `5` bis `100` |
| Floating Action Button | `150` |
| mobile Navigation | `1000` |
| Board-Task-Dialog | `1100` |
| Add-Task-Dialog | `3000` |
| Add-Task-Erfolg | `5000` |
| Kontaktdialog | `9999` |
| Kontakt-Erfolg | `10000` |

Neue Layer erhalten keinen willkürlichen Extremwert. Vor einer Ergänzung wird geprüft:

- in welchem Stacking Context das Element liegt
- ob ein Elternteil `position`, `transform` oder `overflow` setzt
- ob Navigation bewusst überdeckt werden darf
- ob Dialog und Success-Overlay gleichzeitig auftreten können

Eine spätere zentrale Z-Index-Skala wäre ein eigenes Refactoring und kein lokaler Bugfix.

## Animationen

Dialoge und Overlays verwenden kurze Ein- und Ausblendzeiten von überwiegend `200ms` bis `300ms`.

Vorhandene Muster:

- Backdrop über Opacity ein- und ausblenden
- Desktop-Dialog horizontal einschieben
- kompakte Task- und Kontaktdialoge im Portrait von unten einblenden
- Header-Menü kurz horizontal einblenden
- Task-Karte beim Drag leicht drehen und skalieren
- Success-Overlay zeitlich begrenzt ein- und ausblenden

Der Component-State `isClosing` bleibt so lange aktiv, bis die CSS-Ausblendanimation abgeschlossen ist. Erst danach entfernt die übergeordnete Component den Dialog aus dem Template.

Animationen dürfen:

- keine Aktion dauerhaft blockieren
- keinen Dialogschluss vor erfolgreichem Speichern vortäuschen
- keine wichtigen Inhalte außerhalb des Viewports zurücklassen
- keine zweite fachliche State-Quelle bilden

## Assets

Statische Dateien liegen unter:

```text
public/assets/
```

Angular stellt sie zur Laufzeit unter `assets/...` beziehungsweise `/assets/...` bereit.

Template-Beispiel:

```html
<img
  src="assets/icons/icons_edit/check (1).svg"
  alt=""
  aria-hidden="true"
/>
```

SCSS-Beispiel:

```scss
background-image:
  url('/assets/board/task-details/check_button.svg');
```

Nicht verwendet wird:

```text
public/assets/...
```

Pfade verwenden Forward Slashes. Vor einem Commit wird die Anwendung auf Asset-404-Fehler geprüft.

## Semantische Grundstruktur

Die Anwendung verwendet je nach Bereich:

- `<main>` für den Hauptinhalt
- `<header>` für Seiten- und Dialogköpfe
- `<nav>` für Haupt- und rechtliche Navigation
- `<section>` mit Überschriften oder zugänglichen Namen
- `<form>` für zusammengehörige Eingaben
- `<fieldset>` und `<legend>` für Prioritätsgruppen
- `<button>` für Aktionen
- `<a>` beziehungsweise `routerLink` für Navigation
- `<dialog>` für Add Task und Taskdetails

Aktionen werden nicht als klickbare `div`-Elemente umgesetzt, wenn ein nativer Button geeignet ist.

## Buttons und Links

Die Zuordnung lautet:

```text
Route wechseln
→ Link

Aktion ausführen
→ Button
```

Buttons innerhalb eines Formulars erhalten immer einen eindeutigen Typ:

```html
<button type="button">
  Cancel
</button>

<button type="submit">
  Create Task
</button>
```

Damit lösen Close-, Delete-, Menü- oder Subtask-Aktionen keinen unbeabsichtigten Submit aus.

Icon-only-Buttons erhalten einen zugänglichen Namen:

```html
<button
  type="button"
  aria-label="Close dialog"
>
  &times;
</button>
```

Ein sichtbarer Text kann den zugänglichen Namen bereits liefern. Ein zusätzliches `aria-label` wird nur gesetzt, wenn der Zweck sonst nicht eindeutig ist oder sich der sichtbare Inhalt abhängig vom Viewport verändert.

## Bilder und Icons

Dekorative Icons besitzen:

```html
alt=""
aria-hidden="true"
```

Das umgebende Element trägt die Bedeutung:

```html
<button
  type="button"
  aria-label="Add new contact"
>
  <img
    src="assets/contact-details/person_add.svg"
    alt=""
    aria-hidden="true"
  />
</button>
```

Inhaltlich bedeutungsvolle Bilder erhalten dagegen einen beschreibenden Alternativtext. Beispiele im Projekt sind:

- Join-Logo
- Prioritätsicon, wenn kein gleichwertiger sichtbarer Text danebensteht

Ein Icon erhält nicht gleichzeitig einen ausführlichen Alternativtext und eine identische Button-Beschriftung, weil Screenreader die Aussage sonst doppelt ausgeben können.

## Formulare und Beschriftungen

Formularfelder verwenden sichtbare oder visuell versteckte Labels.

Sichtbares Label:

```html
<label for="add_task_title">
  Title
</label>

<input
  id="add_task_title"
  formControlName="title"
/>
```

Visuell verstecktes Auth-Label:

```html
<label
  class="login-card__visually-hidden"
  for="login-email"
>
  Email
</label>
```

Placeholder unterstützen die Darstellung, ersetzen aber nicht das Label.

Kontaktformulare nutzen umschließende Labels mit einem `sr-only`-Text. Auth-Formulare verbinden Eingaben zusätzlich über `aria-describedby` mit ihren Fehlertexten und setzen `aria-invalid`.

Die vollständigen Feldregeln stehen unter [Formulare und Validierung](../features/forms-validation.md).

## Fehlermeldungen

Feldfehler:

- stehen direkt beim betroffenen Feld
- erklären den konkreten Fehler
- werden nicht ausschließlich über eine rote Border vermittelt
- erhalten reservierten Platz, wenn ein Einblenden sonst das Layout verschieben würde

Beispiele:

```text
Please enter a valid email address.
Name must not contain numbers.
Date must not be in the past.
```

Request-Fehler verwenden in den relevanten Bereichen `role="alert"`. Auth-Fehler besitzen zusätzlich `aria-live="polite"`.

Nur ein technisches Supabase-Objekt auszugeben ist weder verständliche UX noch ausreichende Fehlerbehandlung.

## Erfolgsmeldungen und Live Regions

Add Task verwendet für die Erfolgsmeldung:

```html
<div
  class="add-task__success"
  role="status"
>
  ...
</div>
```

Das Kontakt-Success-Overlay ist visuell umgesetzt und automatisch zeitlich begrenzt. Im finalen Template besitzt es jedoch noch keine `role="status"`- oder `aria-live`-Auszeichnung. Diese Grenze wird nicht als bereits gelöst dokumentiert.

Erfolgsmeldungen dürfen:

- erst nach erfolgreicher Persistenz erscheinen
- keine wichtigen Aktionen dauerhaft verdecken
- auf kleinen Viewports nicht hinter der unteren Navigation liegen
- keinen erneuten Submit erfordern, um zu verschwinden

## Tastaturbedienung

Native Buttons und Links übernehmen Enter-, Leertasten- und Tab-Verhalten vom Browser.

Zusätzlich umgesetzt sind:

- Task-Karte mit `tabindex="0"` und `role="button"`
- Öffnen der Task-Karte mit Enter oder Leertaste
- sichtbarer Fokusrahmen an der Task-Karte
- Escape zum Schließen des Header-Menüs
- Escape zum Schließen des mobilen Move-Menüs
- Escape zum Schließen des Kontaktmenüs im Task-Dialog
- Enter in Subtask-Feldern, ohne das gesamte Taskformular abzusenden
- echte Checkboxen für Subtask- und Kontaktauswahl

Beispiel:

```html
<article
  role="button"
  tabindex="0"
  (click)="openCard()"
  (keydown.enter)="openCard()"
  (keydown.space)="
    $event.preventDefault();
    openCard()
  "
>
  ...
</article>
```

Positive `tabindex`-Werte werden nicht verwendet. Die DOM-Reihenfolge soll der sichtbaren Reihenfolge entsprechen.

## Fokuszustände

Ein Fokuszustand muss ohne Maus erkennbar sein.

Im finalen Code existieren unter anderem:

- blauer Outline-Rahmen an Task-Karten
- Outline-Zustände in Sidebar und rechtlicher Navigation
- Border und Box-Shadow an Formulareingaben
- Hintergrund- oder Farbänderungen an mehreren Icon- und Menübuttons

Mehrere lokale Regeln entfernen `outline`, nachdem sie einen alternativen Fokuszustand gesetzt haben:

```scss
&:focus-visible {
  background-color: #eeeeee;
  outline: none;
}
```

Das ist nur dann zulässig, wenn der Ersatz deutlich sichtbar bleibt.

Die globale `.button`-Klasse besitzt im finalen Stand keinen eigenen allgemeinen `:focus-visible`-Block. Deshalb darf nicht angenommen werden, dass automatisch jeder Button einen gleich starken Tastaturfokus besitzt.

## Menüs und Dropdowns

Header- und Task-Karten-Menüs verwenden:

- `aria-haspopup="menu"`
- dynamisches `aria-expanded`
- `role="menu"`
- `role="menuitem"`
- Außenklick zum Schließen
- Escape zum Schließen

Kontaktauswahlen verwenden:

- `role="listbox"`
- `aria-multiselectable="true"`
- echte Checkboxen innerhalb beschrifteter Optionen
- dynamisches `aria-expanded` am Toggle

Die Menüs werden bei erneuter Aktivierung des Triggers wieder geschlossen. Klicks innerhalb des geöffneten Menüs werden so behandelt, dass der übergeordnete Dialog oder die Task-Karte nicht versehentlich aktiviert wird.

## Drag-and-drop

CDK Drag-and-drop ist nicht die einzige Möglichkeit, den Taskstatus zu ändern.

Auf kleinen Viewports steht ein Move-Menü bereit:

```text
Task öffnen oder Move-Menü aktivieren
    ↓
Zielstatus auswählen
    ↓
Task ans Ende der Zielspalte verschieben
```

Damit bleibt die Kernaktion auch ohne Ziehgeste erreichbar.

Zusätzlich:

- ist die Task-Karte per Tastatur aktivierbar
- startet horizontales Board-Scrolling nicht auf Buttons, Inputs oder Links
- wird nach einer erkannten Scrollgeste der folgende Kartenklick unterdrückt
- ist Drag-and-drop während aktiver Suche und Positionsspeicherung deaktiviert

Details stehen unter [Tasks und Board](../features/tasks-board.md).

## Zustände nicht nur über Farbe

Farbe wird mit einer weiteren Information kombiniert:

| Zustand | Zusätzliche Information |
| --- | --- |
| Formularfehler | erklärender Fehlertext |
| aktive Navigation | dunkler Hintergrund |
| ausgewählter Kontakt | Hintergrund- und Textdarstellung |
| Task-Priorität | sichtbarer Prioritätstext oder beschriftetes Icon |
| Subtask-Fortschritt | numerischer Text zusätzlich zum Balken |
| laufender Request | deaktivierte Aktion und teilweise geänderter Buttontext |
| leerer Bereich | erklärender Empty-State-Text |

Bei Prioritätsbuttons ist der aktive Zustand im finalen Template noch nicht zusätzlich über `aria-pressed` ausgezeichnet. Diese semantische Ergänzung bleibt offen.

## Loading-, Disabled- und Fehlerzustände

Nicht verfügbare Aktionen werden während laufender Requests deaktiviert:

- Login und Gastzugang
- Task erstellen
- Task speichern
- Task löschen
- einzelne Subtask-Checkbox
- Dialog schließen während des Speicherns
- Board-Aktionen während Positionsupdates

Ein deaktivierter Button verhindert Doppelaktionen, ersetzt aber keine sichtbare Fehlermeldung.

Leere Zustände und Ladezustände bleiben unterscheidbar:

```text
Loading tasks...
No tasks To do
No contacts found.
```

Details zum State stehen unter [State- und Fehlerbehandlung](state-error-handling.md).

## Touch- und mobile Bedienung

Mobile Aktionsflächen besitzen nicht nur ein kleines sichtbares Icon, sondern eine größere Buttonfläche.

Beispiele:

- Kontakt-FAB mit `56px`
- Header-Profilbutton mit `40px`
- Board-Add-Button mit `40px`
- Dialog-Close-Buttons mit etwa `32px` bis `36px`
- Navigationslinks mit hoher vertikaler Klickfläche

Bei sehr kleinen Viewports werden Inhalte reduziert oder umgeordnet, nicht einfach proportional verkleinert.

Wichtige mobile Regeln:

- kein horizontaler Seiten-Scroll
- Navigation überdeckt keine Formularaktionen
- sticky Aktionsleisten berücksichtigen den unteren Navigationsbereich
- Dialoginhalte bleiben scrollbar
- Close- und Submit-Aktionen bleiben erreichbar
- mobile Taskverschiebung funktioniert ohne Drag

## Textüberlauf

Lange dynamische Inhalte werden abhängig vom Kontext behandelt:

- Kontaktnamen und E-Mails: Ellipsis
- Task-Kategorien: Ellipsis
- Task-Beschreibungen auf Karten: zwei Zeilen
- Task-Titel im Dialog: Umbruch mit `overflow-wrap: anywhere`
- Badge-Reihen: höchstens drei Avatare plus `+N`
- Navigationsbeschriftungen: Ellipsis auf sehr schmalen Viewports

Ein Text wird nur abgeschnitten, wenn die vollständige Information an anderer Stelle erreichbar bleibt, zum Beispiel im Task-Dialog oder über den vollständigen Kontakt.

## Bekannte Accessibility-Grenzen

Der finale Stand enthält eine solide semantische Basis, ist aber nicht vollständig WCAG-geprüft.

Offene oder nicht durchgängig umgesetzte Punkte:

1. Add-Task- und Task-Dialog besitzen kein vollständiges Focus Trap.
2. Der Fokus wird nach dem Schließen eines Dialogs nicht durchgängig zum auslösenden Element zurückgeführt.
3. Escape schließt vorhandene Menüs, aber nicht einheitlich jeden Dialog.
4. Kontaktdialoge verwenden im finalen Template eine beschriftete `<section>`, jedoch noch kein durchgängiges `role="dialog"` mit `aria-modal`.
5. Das Kontakt-Success-Overlay besitzt keine Live-Region.
6. Nicht jeder globale oder lokale Button hat einen gleich deutlichen `:focus-visible`-Zustand.
7. Custom Dropdowns besitzen keine vollständige Pfeiltasten-, Home-/End- und aktiven Optionsverwaltung nach dem vollständigen ARIA-Listbox-Muster.
8. Prioritätsbuttons bilden die Auswahl visuell ab, aber noch nicht über `aria-pressed`.
9. Für die vorhandenen Animationen existiert keine projektweite `prefers-reduced-motion`-Alternative.
10. Farbkontraste wurden nicht als vollständiger WCAG-Kontrastaudit dokumentiert.
11. Automatisierte Tests prüfen Semantik und Tastaturabläufe nur teilweise; CSS-Darstellung und Screenreader-Ausgabe benötigen manuelle Prüfung.
12. Die nativen `<dialog>`-Elemente werden mit `open` gerendert und nicht über `showModal()` geöffnet; browserseitiges modales Fokusverhalten ist dadurch nicht vollständig abgesichert.
13. Die fokussierbare Task-Karte enthält mit dem Move-Button ein weiteres interaktives Element und benötigt deshalb eine gezielte Screenreader-Prüfung oder spätere strukturelle Trennung.
14. Add-Task-Subtask-Aktionen werden im normalen Listenzustand visuell hauptsächlich über Hover eingeblendet; ein gleichwertiger `:focus-within`-Ablauf fehlt.
15. Die als Listbox ausgezeichneten Kontaktauswahlen verwenden Checkbox-Labels, aber noch kein vollständiges `role="option"`- und `aria-selected`-Muster.

Diese Punkte werden nicht durch zusätzliche Dokumentationsbehauptungen verdeckt. Wenn vollständige WCAG-Konformität gefordert wird, ist dafür ein eigener Accessibility-Sprint mit Audit und Regressionstests nötig.

## Empfohlene Weiterentwicklung

Die sinnvollste Reihenfolge für einen späteren Accessibility-Ausbau ist:

1. gemeinsamer sichtbarer `:focus-visible`-Standard für Buttons und Links
2. einheitliche Dialogsemantik
3. Focus Trap und Focus Return
4. vollständige Tastatursteuerung der Custom Dropdowns
5. Live Regions für alle asynchronen Erfolgs- und Fehlerzustände
6. `aria-pressed` oder native Radios für Prioritätsauswahl
7. `prefers-reduced-motion`
8. automatisierte Axe-Prüfung und manueller Screenreader-Test
9. dokumentierter Farbkontrasttest

Diese Arbeiten verändern mehrere Features und werden deshalb nicht als lokaler SCSS-Fix nebenbei umgesetzt.

## Reduced Motion

Im finalen Code existieren mehrere bewegte Dialoge, Karten und Overlays, aber noch keine globale Regel wie:

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-duration: 1ms;
  }
}
```

Eine spätere Ergänzung muss geprüft werden, weil TypeScript bei Dialogen aktuell mit festen Animationszeiten von meist `200ms` rechnet. CSS-Dauer und Timer dürfen nicht unabhängig voneinander geändert werden.

## Style-Budgets

Der Produktions-Build definiert:

| Budget | Warnung | Fehler |
| --- | ---: | ---: |
| initiales Bundle | `500kB` | `1MB` |
| einzelner Component-Style | `15kB` | `25kB` |

Große Component-Styles werden deshalb bewusst beobachtet.

Eine Budgetwarnung bedeutet:

- Ursache prüfen
- Imports und Dopplungen kontrollieren
- lokale Partials erwägen
- im Review dokumentieren, wenn sie bewusst bestehen bleibt

Ein Style wird nicht allein zur Reduzierung der Dateigröße globalisiert. Dadurch könnten ungenutzte Regeln anwendungsweit geladen und die Kaskade schwerer kontrollierbar werden.

## Responsive Prüfmatrix

Mindestens geprüft werden:

| Breite oder Zustand | Zweck |
| --- | --- |
| `320px` | kleinster vorgesehener mobiler Bereich |
| `360px` | Wechsel der kompakten Navigation |
| `375px` | verbreiteter Smartphone-Viewport |
| `428px` | großer Smartphone-Viewport |
| `480px` | mobile Dialog- und Overlay-Grenzen |
| `640px` | große mobile Breite |
| `768px` | Tablet-Portrait |
| `798px` | letzter echter mobiler Board-Pixel |
| `799px` | letzter einspaltiger Add-Task-Pixel |
| `800px` | Start der mittleren Add-Task-Darstellung |
| `960px` | Login-/Tablet-Anpassung |
| `1024px` | Tablet und Landscape-Obergrenze |
| `1120px` | letzter kompakter Layout-Pixel |
| `1121px` | Start der festen Sidebar |
| `1280px` | Kontakt-Dialog- und Desktopgrenze |
| `1440px` | maximale Hauptinhaltsbreite |
| `1920px` | großer Desktop ohne unkontrolliertes Strecken |

Zusätzlich werden geprüft:

- Smartphone Landscape
- Tablet Landscape
- geringe Viewporthöhe
- Browserzoom
- lange Namen und Beschreibungen
- leere und vollständig gefüllte Listen
- geöffnete Dropdowns nahe dem Viewportrand
- Dialoge mit sichtbaren Feldfehlern

## Manueller Tastaturtest

Vor dem Review:

```text
Seite öffnen
    ↓
mit Tab durch Header und Navigation gehen
    ↓
sichtbaren Fokus prüfen
    ↓
Board-Karte mit Enter und Leertaste öffnen
    ↓
Move-Menü öffnen und schließen
    ↓
Formularfelder und Aktionen erreichen
    ↓
Dialog über Close oder Cancel schließen
    ↓
weitere Navigation ohne Maus fortsetzen
```

Zusätzlich wird geprüft:

- kein Tastaturfokus landet hinter einem sichtbaren Overlay
- kein unsichtbares Menü bleibt fokussierbar
- `type="button"` verhindert unbeabsichtigte Submits
- Escape schließt die dafür implementierten Menüs
- Disabled-Aktionen werden nicht ausgelöst

## Manueller Screenreader- und Semantiktest

Für einen Abschlussreview werden mindestens kontrolliert:

- Seitensprache ist in `index.html` als Englisch gesetzt
- Überschriften ergeben eine nachvollziehbare Struktur
- Navigationen besitzen zugängliche Namen
- Icon-only-Buttons werden verständlich angekündigt
- Inputs besitzen Labels
- Auth-Fehler sind ihren Feldern zugeordnet
- Dialogtitel wird bei den nativen Task-Dialogen verwendet
- Task-Karten lassen ihren Zweck erkennen
- Fortschritt ist nicht nur über den visuellen Balken verständlich
- Statusänderung ist ohne Ziehgeste möglich

Die bekannte fehlende Kontakt-Live-Region und die uneinheitliche Dialogfokusführung werden dabei als offene Punkte protokolliert.

## Visuelle Prüfung

Für jede geänderte Component:

- Standardzustand
- Hover
- `:focus-visible`
- Active oder Selected
- Disabled
- Loading
- Error
- Empty State
- lange Inhalte
- schmalster relevanter Viewport
- höchste relevante Landscape-Kompression

Bei Dialogen zusätzlich:

- Close-Button sichtbar
- Überschrift sichtbar oder semantisch vorhanden
- mittlerer Inhalt scrollbar
- Footer-Aktionen erreichbar
- Hintergrund gesperrt
- Overlay-Klick schließt nur, wenn vorgesehen
- Innenklick schließt nicht
- Schließanimation endet ohne State-Rest

## Technische Prüfungen

Vor Review oder Pull Request:

```bash
npm test -- --watch=false
npm run build
git diff --check
git status --short
```

Zusätzlich:

- Browserkonsole ohne neue Fehler
- keine Asset-404
- keine ungewollte horizontale Page-Scrollbar
- keine CSS-Budgetüberschreitung ungeprüft lassen
- keine zufälligen hohen Z-Index-Werte
- keine neuen globalen Selektoren für einen lokalen Bug
- keine entfernten Fokuszustände ohne sichtbaren Ersatz
- keine interaktive Fläche nur über Hover erreichbar machen

Angular-Unit-Tests ersetzen keine visuelle und tastaturbasierte Prüfung. JSDOM berechnet das echte Browserlayout nicht.

## Entscheidungshilfe

| Frage | Ziel |
| --- | --- |
| Betrifft die Regel nur eine Component? | Component-SCSS |
| Wird ein stabiler Wert an mehreren Stellen verwendet? | globales Token |
| Wird ein Compile-Time-Breakpoint benötigt? | Sass-Variable |
| Soll ein Wert lokal überschreibbar bleiben? | CSS Custom Property |
| Wiederholt sich ein Layoutmuster verständlich? | Mixin |
| Ist nur ein Dialog betroffen? | lokaler Dialogstyle |
| Ändert die Regel Sidebar, Header oder Navigation? | Layoutänderung mit Teamabstimmung |
| Entsteht horizontaler Überlauf? | zuerst Flex-/Grid-Minimum und Scroll-Eigentümer prüfen |
| Ist eine Aktion klickbar? | semantischer Button |
| Wechselt das Element eine Route? | Link |
| Ist ein Icon rein dekorativ? | leeres `alt` und gegebenenfalls `aria-hidden` |
| Ist ein Icon die einzige sichtbare Aktionserklärung? | zugänglichen Namen am Button ergänzen |
| Wird ein Fehler nur rot dargestellt? | erklärenden Text ergänzen |
| Ist ein Kartenstatus nur per Drag erreichbar? | alternative Move-Aktion bereitstellen |
| Wird `outline` entfernt? | sichtbaren und geprüften Ersatz sicherstellen |
| Öffnet sich ein modaler Bereich? | Dialogsemantik, Scroll-Lock und Fokusführung prüfen |

## Häufige Fehler vermeiden

- einen lokalen Bug durch einen globalen Elementselektor lösen
- leere 7–1-Dateien vorsorglich mit ungenutzten Regeln füllen
- Breakpoints lokal neu erfinden, obwohl ein zentraler Wert passt
- `799/800px` pauschal als Navigationsgrenze behandeln
- `100vw` in verschachtelten Layouts ohne Overflow-Prüfung verwenden
- `min-width: 0` bei flexiblen Scrollbereichen vergessen
- den gesamten Dialog scrollen lassen, sodass Close und Aktionen verschwinden
- mehrere konkurrierende Body-Scroll-Locks übereinanderlegen
- zufällige Z-Index-Werte erhöhen, bis ein Overlay sichtbar wird
- Hover als einzige Möglichkeit verwenden, Subtask-Aktionen zu entdecken
- `outline: none` ohne deutlichen Fokus-Ersatz verwenden
- klickbare `div`-Elemente statt Buttons einsetzen
- Placeholder als einziges Label verwenden
- Icon-Buttons ohne zugänglichen Namen erstellen
- dekorative Icons mit wiederholendem Alternativtext versehen
- Fehler ausschließlich über Farbe darstellen
- Erfolg vor abgeschlossener Persistenz anzeigen
- Drag-and-drop ohne alternative Statusänderung anbieten
- visuelle Auswahl ohne semantischen Zustand als vollständig zugänglich bezeichnen
- eine WCAG-Konformität behaupten, ohne Audit und dokumentierte Prüfergebnisse

## Weiterführende Dokumentation

- [Anwendungsarchitektur](../architecture/application.md)
- [Authentifizierung und Routing](../architecture/authentication-routing.md)
- [Kontakte](../features/contacts.md)
- [Tasks und Board](../features/tasks-board.md)
- [Formulare und Validierung](../features/forms-validation.md)
- [Code-Konventionen](conventions.md)
- [State- und Fehlerbehandlung](state-error-handling.md)
- [Tests](testing.md)
- [Entwicklungsworkflow](../operations/development-workflow.md)
- [Build und Deployment](../operations/deployment.md)