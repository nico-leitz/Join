# SCSS- und Responsive-Guide

Dieses Dokument beschreibt den Umgang mit SCSS, Breakpoints, Assets und responsive Verhalten im Join-Projekt.

Ziel ist, dass Styling-Anpassungen kontrolliert bleiben und nicht versehentlich globale Bereiche beschädigen.

---

## Grundregel

Styling wird so lokal wie möglich gehalten.

```text
Component betrifft nur eine Component
→ Component-SCSS

Regel betrifft mehrere Bereiche
→ globale SCSS-Struktur

Regel betrifft Layout-Grundstruktur
→ nur nach Teamabsprache ändern
```

Globale SCSS-Dateien werden nicht ohne Absprache grundlegend refactored.

---

## SCSS-Struktur

Die globale SCSS-Struktur liegt unter:

```text
src/styles/
├── abstracts/
├── base/
├── components/
├── layout/
├── pages/
├── themes/
├── utilities/
└── vendors/
```

Der zentrale Einstieg ist:

```text
src/styles.scss
```

Dort wird die globale Struktur eingebunden.

---

## Component-SCSS

Component-SCSS liegt direkt bei der Component.

Beispiel:

```text
contact-detail.scss
contact-list.scss
board.scss
task-card.scss
```

Component-SCSS ist zuständig für:

```text
Layout innerhalb der Component
Abstände innerhalb der Component
responsive Verhalten der Component
Hover- und Focus-Zustände der Component
Dialog- oder Kartenstyling der Component
```

---

## Globale Styles

Globale Styles sind nur sinnvoll, wenn eine Regel wirklich mehrfach gebraucht wird.

Beispiele:

```text
Farben
Breakpoints
Typografie
Reset
Grundlayout
wiederverwendbare Utility-Klassen
```

Nicht globalisieren, wenn eine Regel nur eine einzelne Component betrifft.

---

## Keine großen SCSS-Refactorings während Feature-Arbeit

Große SCSS-Refactorings werden nicht nebenbei gemacht.

Nicht während einer Feature-Aufgabe:

```text
globale Ordnerstruktur umbauen
alle Component-SCSS-Dateien verschieben
Breakpoints grundlegend ändern
Reset austauschen
Typografie global neu definieren
```

Solche Änderungen betreffen das ganze Team und müssen geplant werden.

---

## Breakpoints

Breakpoints liegen zentral in den SCSS-Abstracts.

Wichtige Bereiche:

```text
Mobile
Tablet
Desktop
Landscape
```

Die aktuellen Breakpoints sollen verwendet und nicht lokal neu erfunden werden.

Beispiel:

```scss
@use 'abstracts/breakpoints' as bp;

@media (max-width: bp.$breakpoint-tablet-sm-max) {
  // mobile and small tablet styles
}
```

---

## Mobile Grenze

Die wichtige Grenze für Sidebar und mobile Navigation liegt bei:

```text
799px / 800px
```

Bedeutung:

```text
bis 799px
→ mobile Navigation

ab 800px
→ Desktop-/Tablet-Layout mit Sidebar
```

Diese Grenze darf nicht ohne Absprache verändert werden.

---

## Sass-Rechenregel

Bei Breakpoint-Rechnungen mit Variablen auf Sass-Syntax achten.

Problematisch:

```scss
@media (min-width: bp.$breakpoint-tablet-xl + 1px) {
  // ...
}
```

Besser:

```scss
$desktop-start: bp.$breakpoint-tablet-xl + 1px;

@media (min-width: $desktop-start) {
  // ...
}
```

oder:

```scss
@media (min-width: calc(#{bp.$breakpoint-tablet-xl} + 1px)) {
  // ...
}
```

---

## Responsive Priorität

Responsive Verhalten wird nach User-Flows geprüft, nicht nur nach Screenshot.

Wichtig sind:

```text
Kontaktliste bedienen
Kontaktdetail öffnen
Dialog öffnen und schließen
Formular absenden
Board bedienen
Task Card öffnen
Task erstellen
Task verschieben
mobile Navigation nutzen
```

Eine Ansicht gilt nur als stabil, wenn sie auch bedienbar ist.

---

## Mobile First oder Desktop First

Im bestehenden Projekt sind beide Muster möglich, je nach Component-Stand.

Wichtig ist nicht die Theorie, sondern Konsistenz innerhalb einer Datei.

Nicht gut:

```text
mobile Regeln
Desktop Regeln
wieder mobile Regeln
Tablet Regeln
nochmal Desktop Regeln
```

Besser:

```text
Basis
Mobile-Anpassungen
Tablet-Anpassungen
Desktop-Anpassungen
Landscape-Anpassungen
```

---

## Dialoge

Dialoge müssen auf allen Viewports bedienbar bleiben.

Prüfen:

```text
Close-Button sichtbar
Submit-Button sichtbar
Cancel-Button sichtbar
Formular scrollbar
Hintergrund nicht scrollbar
keine Buttons übereinander
keine abgeschnittenen Felder
Fehlermeldungen sichtbar
```

Bei Dialogen soll der mittlere Inhalt scrollen, nicht der gesamte Bildschirm unkontrolliert.

---

## Body-Scroll-Lock

Wenn ein Dialog geöffnet ist, soll der Hintergrund nicht mitscrollen.

Ablauf:

```text
Dialog öffnen
  ↓
body bekommt Lock-Klasse
  ↓
Hintergrund scrollt nicht

Dialog schließen
  ↓
Lock-Klasse entfernen
```

Beim Zerstören der Page muss der Lock ebenfalls entfernt werden.

---

## Mobile Navigation

Auf mobilen Ansichten wird die Sidebar durch die mobile Navigation ersetzt.

Regel:

```text
bis 799px
→ Mobile Navigation sichtbar
→ Sidebar ausgeblendet

ab 800px
→ Sidebar sichtbar
→ Mobile Navigation ausgeblendet
```

Die mobile Navigation muss immer erreichbar bleiben und darf nicht von Dialogen oder Overlays ungewollt verdeckt werden, außer ein Dialog liegt bewusst modal über der gesamten Ansicht.

---

## Sidebar

Die Sidebar ist Teil des Desktop-/Tablet-Layouts.

Sie sollte nicht durch Feature-SCSS überschrieben werden.

Nicht in Feature-SCSS ändern:

```text
globale Sidebar-Breite
globale Sidebar-Position
globale Sidebar-Z-Index-Regeln
```

Solche Änderungen gehören in Layout-SCSS und müssen abgestimmt werden.

---

## Header

Der Header ist Layout-Bestandteil.

Feature-Components sollen den Header nicht direkt stylen.

Falls ein Feature unter dem Header falsch sitzt, zuerst prüfen:

```text
Page-Layout
Wrapper-Höhen
Scrollbereiche
z-index
mobile Breakpoints
```

---

## Scrollbereiche

Scrollverhalten muss bewusst gesetzt werden.

Grundidee:

```text
Page hält den Rahmen
Header bleibt sichtbar
Navigation bleibt sichtbar
Listen oder Inhaltsbereiche scrollen gezielt
Dialoginhalt scrollt intern
```

Nicht gewünscht:

```text
Body scrollt unkontrolliert
Dialog verschwindet nach oben
Footer überdeckt Buttons
horizontaler Scroll entsteht
```

---

## Horizontales Scrollen vermeiden

Horizontales Scrollen ist fast immer ein Fehler.

Typische Ursachen:

```text
feste Breiten
zu große min-width
lange Wörter ohne Umbruch
Buttons ohne Wrap-Regeln
absolute Positionierung
negative Margins
100vw in verschachtelten Layouts
```

Prüfen:

```text
320px
360px
375px
428px
768px
799px
1024px
1280px
1440px
1920px
```

---

## Assets

Angular liefert Assets aus dem `public`-Ordner aus.

Pfad im Code:

```text
assets/...
```

Datei im Projekt:

```text
public/assets/...
```

Beispiel:

```html
<img src="assets/icons/close.svg" alt="" />
```

Nicht verwenden:

```html
<img src="./assets/icons/close.svg" />
<img src="public/assets/icons/close.svg" />
<img src="assets\icons\close.svg" />
```

Immer Forward Slashes verwenden.

---

## Icons

Dekorative Icons bekommen ein leeres `alt`.

```html
<img src="assets/icons/close.svg" alt="" />
```

Wenn ein Icon allein eine Button-Aktion darstellt, bekommt der Button ein `aria-label`.

```html
<button
  type="button"
  aria-label="Close dialog"
>
  <img src="assets/icons/close.svg" alt="" />
</button>
```

---

## Hover und Focus

Hover-Zustände sollen sichtbar, aber nicht übertrieben sein.

Zusätzlich muss es Focus-Zustände geben.

Prüfen:

```text
Tastaturbedienung
sichtbarer Fokus
Buttons erkennbar
Icon und Text reagieren gemeinsam
kein Layoutsprung beim Hover
```

Hover darf nicht nur über Farbe funktionieren, wenn dadurch die Bedienung unklar wird.

---

## Buttons

Buttons dürfen auf kleinen Viewports nicht übereinanderliegen oder abgeschnitten werden.

Prüfen:

```text
Cancel und Submit nebeneinander oder sinnvoll untereinander
ausreichende Höhe
kein abgeschnittener Text
keine Überlagerung mit Footer
disabled-State sichtbar
Focus-State sichtbar
```

---

## Forms

Formulare müssen Platz für Fehlermeldungen haben.

Wichtig:

```text
Fehlermeldung unter dem Feld
Input-Border bei Fehler sichtbar
kein Layoutsprung, wenn möglich
Submit bei ungültigem Formular verhindern
keine nativen Browsermeldungen, wenn eigene Validierung vorgesehen ist
```

---

## Task Cards

Task Cards müssen auf allen Board-Breiten lesbar bleiben.

Prüfen:

```text
Titel bricht sauber um
Beschreibung läuft nicht heraus
Badges bleiben innerhalb der Karte
Priorität bleibt sichtbar
Subtask-Fortschritt bleibt sichtbar
Karte bleibt klickbar
```

---

## Kontaktbadges

Kontaktbadges sollen nicht aus Karten oder Detailbereichen herauslaufen.

Bei wenig Platz:

```text
Badges begrenzen
zusätzliche Kontakte als +N anzeigen
Namen nicht vollständig ausschreiben
runde Badges nicht verzerren
```

---

## Z-Index

Z-Index-Werte nur gezielt setzen.

Typische Ebenen:

```text
normaler Inhalt
Header / Sidebar
mobile Navigation
Overlay
Dialog
Success-Overlay
```

Nicht viele zufällige hohe Werte verwenden.

Schlecht:

```scss
z-index: 999999;
```

Besser:

```scss
z-index passend zur bestehenden Ebene verwenden
```

Wenn mehrere Overlays kollidieren, sollte die Layer-Struktur gemeinsam geprüft werden.

---

## SCSS-Nesting

Nesting sparsam verwenden.

Gut:

```scss
.card {
  display: flex;

  &__title {
    font-weight: 700;
  }

  &--active {
    background: #2a3647;
  }
}
```

Nicht gut:

```scss
.page {
  .wrapper {
    .content {
      .card {
        .title {
          // zu tief
        }
      }
    }
  }
}
```

Zu tiefes Nesting macht Overrides schwerer.

---

## Klassenbenennung

Klassen sollen ihren Zweck beschreiben.

Gute Beispiele:

```text
contact-list
contact-list__item
contact-list__item--active
task-card
task-card__progress
dialog__actions
```

Ungünstig:

```text
box
thing
left
blue
test
new
```

Klassen sollten nicht nach aktueller Farbe benannt werden, wenn sie eine Funktion beschreiben.

---

## Keine Magic Numbers ohne Grund

Werte wie diese sollten nachvollziehbar sein:

```scss
top: 73px;
height: calc(100vh - 96px);
z-index: 30;
```

Wenn ein Wert wegen Header, Footer oder Figma notwendig ist, sollte der Zusammenhang klar sein.

Bei mehrfach genutzten Werten besser Variable oder gemeinsame Regel verwenden.

---

## Wann globale Anpassung sinnvoll ist

Eine globale Anpassung ist sinnvoll, wenn:

```text
mehrere Components denselben Wert brauchen
ein Layout-Baustein betroffen ist
Breakpoints betroffen sind
eine wiederkehrende Utility entsteht
Typografie projektweit angepasst wird
```

Vorher im Team abstimmen.

---

## Wann lokale Anpassung besser ist

Eine lokale Anpassung ist besser, wenn:

```text
nur eine Component betroffen ist
nur ein Dialog betroffen ist
nur ein Hover betroffen ist
nur eine Card betroffen ist
nur ein Bug in einem Feature gelöst wird
```

---

## Prüfliste vor UI-Commit

Vor einem UI-Commit prüfen:

```text
[ ] betroffene Viewports getestet
[ ] kein horizontaler Scroll
[ ] Dialoge bedienbar
[ ] Buttons sichtbar
[ ] Close-Buttons sichtbar
[ ] Header und Navigation korrekt
[ ] Konsole ohne Asset-Fehler
[ ] keine ungewollten globalen Änderungen
[ ] npm run build erfolgreich
[ ] git diff --check ohne Ausgabe
```

---

## Häufige Fehler vermeiden

### Asset-Pfad falsch

Falsch:

```html
<img src="public/assets/icons/add.svg" />
```

Richtig:

```html
<img src="assets/icons/add.svg" />
```

---

### Component überschreibt Layout

Falsch:

```scss
.sidebar {
  display: none;
}
```

in einer Feature-Component.

Richtig:

```text
Layout-Regel in Layout-SCSS prüfen und im Team abstimmen.
```

---

### Globaler Fix für lokalen Bug

Falsch:

```text
globale Button-Klasse ändern, obwohl nur ein Dialog betroffen ist
```

Richtig:

```text
Dialog-SCSS lokal korrigieren
```

---

### Z-Index-Kampf

Falsch:

```scss
z-index: 99999;
```

Richtig:

```text
Layer prüfen und passenden bestehenden Bereich verwenden
```

---

## Zusammenfassung

SCSS-Anpassungen sollen nachvollziehbar und möglichst lokal bleiben.

Component-SCSS löst Component-Probleme.  
Globale SCSS-Dateien enthalten projektweite Regeln.  
Breakpoints werden zentral genutzt.  
Assets werden über `assets/...` referenziert.  
Responsive Verhalten wird über echte User-Flows geprüft, nicht nur über einzelne Screenshots.

So bleibt das Styling stabil und teamfähig.