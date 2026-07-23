# Accessibility und UX

Dieses Dokument beschreibt grundlegende Accessibility- und UX-Regeln im Join-Projekt. Ziel ist, dass die Anwendung nicht nur optisch funktioniert, sondern auch bedienbar, verständlich und robust ist.

---

## Grundregel

Interaktive Elemente müssen als echte interaktive Elemente umgesetzt werden.

```text
Navigation
→ Link

Aktion
→ Button

Formulareingabe
→ Input, Select, Textarea

Dialog
→ klarer modaler Bereich mit Close-Aktion
```

Nicht vorgesehen:

```html
<div (click)="save()">Save</div>
```

Vorgesehen:

```html
<button
  type="button"
  (click)="save()"
>
  Save
</button>
```

---

## Ziele

Accessibility und UX sollen sicherstellen, dass:

```text
Buttons erkennbar sind
Fokus sichtbar ist
Dialoge bedienbar bleiben
Formulare verständliche Fehler zeigen
Navigation per Tastatur möglich ist
Icons korrekt beschrieben oder versteckt sind
mobile Viewports nicht blockieren
User nach Aktionen Feedback erhalten
```

---

## Buttons

Buttons werden für Aktionen verwendet.

Beispiele:

```text
Create
Save
Cancel
Delete
Edit
Close
Add Subtask
Move Task
```

Ein Button braucht immer einen klaren Zweck.

```html
<button type="submit">
  Create Task
</button>
```

Für reine Aktionen kein Link verwenden.

Falsch:

```html
<a (click)="deleteTask()">Delete</a>
```

Richtig:

```html
<button
  type="button"
  (click)="deleteTask()"
>
  Delete
</button>
```

---

## Links

Links werden für Navigation verwendet.

Beispiel:

```html
<a routerLink="/board">
  Board
</a>
```

Nicht für Aktionen nutzen, die keine Route wechseln.

---

## Icon-Buttons

Wenn ein Button nur ein Icon zeigt, braucht der Button ein `aria-label`.

```html
<button
  type="button"
  aria-label="Close dialog"
>
  <img src="assets/icons/close.svg" alt="" />
</button>
```

Das Icon selbst ist dekorativ und bekommt deshalb:

```html
alt=""
```

---

## Dekorative Icons

Dekorative Icons brauchen keinen Alternativtext.

```html
<img
  src="assets/icons/priority-urgent.svg"
  alt=""
/>
```

Der sichtbare Text oder das umgebende Element erklärt die Bedeutung.

---

## Bedeutungsvolle Bilder oder Icons

Wenn ein Bild selbst Bedeutung trägt, braucht es einen sinnvollen Alternativtext.

Beispiel:

```html
<img
  src="assets/icons/urgent.svg"
  alt="Urgent priority"
/>
```

Bei den meisten UI-Icons ist aber ein `aria-label` am Button besser.

---

## Focus-State

Alle interaktiven Elemente brauchen einen sichtbaren Focus-State.

Betroffen:

```text
Buttons
Links
Inputs
Selects
Textarea
Checkboxes
Navigationseinträge
Dialog-Close-Buttons
Task Cards, wenn fokussierbar
```

Der Focus darf nicht entfernt werden, ohne ersetzt zu werden.

Nicht verwenden:

```scss
outline: none;
```

ohne sichtbaren Ersatz.

Besser:

```scss
button:focus-visible {
  outline: 2px solid #29abe2;
  outline-offset: 2px;
}
```

---

## Tastaturbedienung

Die Anwendung soll grundsätzlich per Tastatur bedienbar bleiben.

Prüfen:

```text
Tab springt logisch durch die Seite
Enter aktiviert Links und Buttons
Space aktiviert Buttons
Focus bleibt sichtbar
Dialoge sind erreichbar
Close-Button ist erreichbar
Submit ist erreichbar
```

---

## Tab-Reihenfolge

Die Tab-Reihenfolge soll der sichtbaren Reihenfolge folgen.

Nicht mit positiven `tabindex`-Werten arbeiten.

Falsch:

```html
<button tabindex="5">
  Save
</button>
```

Richtig:

```html
<button type="submit">
  Save
</button>
```

Nur in Ausnahmefällen verwenden:

```html
tabindex="0"
```

zum Beispiel, wenn ein eigenes Element bewusst fokussierbar gemacht werden muss.

---

## Dialoge

Dialoge müssen auf allen Viewports bedienbar bleiben.

Wichtig:

```text
Close-Button sichtbar
Titel oder klare Überschrift vorhanden
Formular vollständig erreichbar
Submit sichtbar
Cancel sichtbar
Inhalt scrollt intern
Hintergrund scrollt nicht
Dialog überdeckt keine eigenen Buttons
```

---

## Dialog-Rollen

Ein Dialog kann semantisch als Dialog markiert werden.

```html
<section
  class="dialog"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">
    Add contact
  </h2>
</section>
```

Bei einfachen Projekt-Dialogen ist vor allem wichtig, dass Struktur, Bedienbarkeit und Fokus stimmen.

---

## Dialog schließen

Ein Dialog sollte geschlossen werden können über:

```text
Close-Button
Cancel-Button
nach erfolgreichem Submit
```

Optional:

```text
Escape-Taste
Klick auf Overlay
```

Wenn Overlay-Klick verwendet wird, darf ein Klick im Dialog selbst den Dialog nicht schließen.

---

## Focus bei Dialogen

Beim Öffnen eines Dialogs sollte der Fokus sinnvoll gesetzt werden.

Gute Ziele:

```text
Dialog-Überschrift
erstes Eingabefeld
Close-Button
```

Beim Schließen sollte der Fokus möglichst zur auslösenden Aktion zurückkehren.

Beispiel:

```text
Add Contact Button
  ↓
Dialog öffnet
  ↓
Dialog schließt
  ↓
Focus zurück auf Add Contact Button
```

Für das MVP reicht es, wenn der Dialog vollständig per Tastatur erreichbar bleibt.

---

## Body-Scroll-Lock

Bei geöffnetem Dialog darf der Hintergrund nicht unkontrolliert scrollen.

```text
Dialog öffnen
→ Body-Scroll sperren

Dialog schließen
→ Body-Scroll freigeben
```

Beim Zerstören der Page muss der Lock ebenfalls entfernt werden.

---

## Formulare

Jedes Formularfeld braucht eine klare Beschriftung.

```html
<label for="contact-email">
  Email
</label>

<input
  id="contact-email"
  type="email"
  formControlName="email"
/>
```

Placeholder ersetzen kein Label.

Ungünstig:

```html
<input placeholder="Email" />
```

Besser:

```html
<label for="email">
  Email
</label>
<input id="email" />
```

---

## Fehlermeldungen

Fehlermeldungen stehen direkt unter dem betroffenen Feld.

```html
@if (isFieldInvalid('email')) {
  <p class="form-field__error">
    Please enter a valid email address.
  </p>
}
```

Fehlermeldungen sollen verständlich sein.

Gut:

```text
Please enter a valid email address.
Name must not contain numbers.
Date must not be in the past.
```

Ungünstig:

```text
Invalid.
Error.
Wrong input.
```

---

## Fehler visuell anzeigen

Ein ungültiges Feld sollte sichtbar markiert werden.

```html
<input
  [class.form-field__input--invalid]="isFieldInvalid('email')"
/>
```

Zusätzlich zur Farbe sollte die Fehlermeldung den Fehler erklären.

Nur Rot reicht nicht aus.

---

## Native Browsermeldungen vermeiden

Wenn eigene Validierung verwendet wird, native Browsermeldungen deaktivieren.

```html
<form
  novalidate
  (ngSubmit)="submit()"
>
  ...
</form>
```

Dadurch bleiben Fehlermeldungen einheitlich.

---

## Submit-Verhalten

Ein ungültiges Formular darf nicht gespeichert werden.

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  await this.save();
}
```

Nach Fehlern bleibt das Formular offen.

---

## Loading-UX

Während gespeichert wird:

```text
Submit-Button deaktivieren
Doppel-Submit verhindern
optional Buttontext ändern
Fehler nach Fehlschlag anzeigen
Success nur nach Erfolg zeigen
```

Beispiel:

```html
<button
  type="submit"
  [disabled]="form.invalid || isLoading()"
>
  {{ isLoading() ? 'Saving...' : 'Save' }}
</button>
```

---

## Success-Feedback

Nach erfolgreichen Aktionen soll der User Feedback erhalten.

Beispiele:

```text
Contact successfully created
Contact successfully updated
Task successfully created
Task successfully deleted
```

Success-Overlays dürfen wichtige Buttons nicht dauerhaft verdecken.

---

## Error-Feedback

Bei Fehlern soll der User verstehen, dass die Aktion nicht abgeschlossen wurde.

Beispiele:

```text
Task could not be saved.
Contact could not be deleted.
Board could not be loaded.
```

Technische Details bleiben in der Konsole.

---

## Navigation

Navigationseinträge sollen echte Links sein.

```html
<a routerLink="/contacts">
  Contacts
</a>
```

Die aktive Seite muss sichtbar markiert werden.

```html
<a
  routerLink="/contacts"
  routerLinkActive="active"
>
  Contacts
</a>
```

---

## Sidebar und mobile Navigation

Sidebar und mobile Navigation müssen dieselben Hauptbereiche erreichbar machen.

```text
Summary
Add Task
Board
Contacts
```

Auf mobilen Viewports darf die Navigation keine Formularbuttons oder Dialogaktionen verdecken.

---

## Mobile Bedienbarkeit

Mobile Bedienung braucht ausreichend große Touch-Ziele.

Prüfen:

```text
Buttons gut antippbar
Close-Button gut erreichbar
Navigation gut antippbar
keine zu kleinen Icon-Flächen
kein horizontaler Scroll
Formularfelder vollständig sichtbar
```

Icon-Buttons sollten nicht nur das Icon selbst als Klickfläche haben, sondern ausreichend Padding.

---

## Kontaktbereich

Im Kontaktbereich prüfen:

```text
Kontakt auswählen ist eindeutig
aktiver Kontakt ist sichtbar markiert
Detailansicht zeigt klaren Namen
Edit und Delete sind erreichbar
Create-Dialog ist mobil bedienbar
Edit-Dialog ist mobil bedienbar
Success-Overlay stört Navigation nicht dauerhaft
```

---

## Task- und Boardbereich

Im Board prüfen:

```text
Task Cards sind klickbar
Task Cards bleiben lesbar
Priorität ist verständlich
Subtask-Fortschritt ist verständlich
Kontaktbadges laufen nicht aus
Detaildialog ist bedienbar
Add Task ist erreichbar
```

---

## Drag-and-drop Accessibility

Drag-and-drop ist für Tastatur und mobile Geräte schwierig.

Deshalb sollte es eine Alternative geben.

Beispiel:

```text
Move to
→ To do
→ In progress
→ Await feedback
→ Done
```

Diese Alternative kann über Buttons oder ein Menü umgesetzt werden.

Wichtig:

```text
Statuswechsel ist auch ohne Drag-and-drop möglich
mobile User können Tasks verschieben
Tastatur-User sind nicht ausgeschlossen
```

---

## Task Card als Button oder Card

Wenn eine Task Card klickbar ist, sollte sie entweder einen Button enthalten oder selbst fokussierbar und per Tastatur aktivierbar sein.

Einfacher Ansatz:

```html
<button
  type="button"
  class="task-card"
  (click)="openTask()"
>
  ...
</button>
```

Wenn das wegen Layout nicht passt, braucht die Card mindestens:

```html
<article
  tabindex="0"
  role="button"
  (click)="openTask()"
  (keydown.enter)="openTask()"
  (keydown.space)="openTask()"
>
  ...
</article>
```

Ein echter Button ist meist robuster.

---

## Farben und Kontrast

Texte müssen gut lesbar bleiben.

Prüfen:

```text
heller Text auf dunklem Hintergrund
dunkler Text auf hellem Hintergrund
Fehlermeldungen
disabled Buttons
Navigation aktiv/inaktiv
Hover und Focus
```

Farbe darf nicht die einzige Information sein.

Beispiel:

```text
Fehler
→ rote Border + Fehlermeldung

aktiver Navigationspunkt
→ Farbe + Hintergrund/Markierung
```

---

## Text und Sprache

UI-Texte sollen kurz und verständlich sein.

Gut:

```text
Create contact
Delete
Cancel
Save
Task could not be saved.
```

Ungünstig:

```text
Execute operation
An error occurred during async process
Submit data object
```

---

## Leere Zustände

Leere Zustände sollen verständlich sein.

Beispiele:

```text
No contacts found.
No tasks in this column.
No subtasks yet.
```

Ein leerer Bereich sollte nicht wie ein Ladefehler wirken.

---

## Ladezustände

Wenn Daten geladen werden, sollte der User eine Rückmeldung bekommen.

Beispiele:

```text
Loading contacts...
Loading board...
```

Bei sehr kurzen Ladezeiten reicht oft ein deaktivierter Button.

---

## Keine Layoutsprünge

Fehlermeldungen, Success-Overlays und Dialoginhalte sollen keine starken Layoutsprünge erzeugen.

Prüfen:

```text
Formular bleibt bedienbar
Buttons bleiben sichtbar
Dialoghöhe bleibt kontrolliert
Fehlermeldungen verschieben keine wichtigen Aktionen aus dem Viewport
```

---

## Z-Index und Overlays

Overlays müssen klar gestapelt sein.

Typische Reihenfolge:

```text
Inhalt
Header / Sidebar
Mobile Navigation
Overlay
Dialog
Success Overlay
```

Keine zufälligen Extremwerte verwenden.

Falsch:

```scss
z-index: 999999;
```

Richtig:

```text
bestehende Layer prüfen und passend einordnen
```

---

## Responsive UX

Responsive bedeutet nicht nur, dass nichts kaputt aussieht.

Eine responsive Ansicht muss bedienbar sein.

Prüfen:

```text
User kann navigieren
User kann Dialog schließen
User kann Formular ausfüllen
User kann speichern
User kann abbrechen
User sieht Fehlermeldungen
User kann zurück zur Hauptansicht
```

---

## Mindestprüfungen

Prüfen auf:

```text
320px
360px
375px
428px
768px
799px
800px
1024px
1280px
1440px
1920px
```

Zusätzlich:

```text
Mobile Landscape
Tablet Landscape
```

---

## Test mit Tastatur

Manueller Tastaturtest:

```text
Seite öffnen
Tab drücken
sichtbaren Focus prüfen
Navigation erreichen
Dialog öffnen
Formular ausfüllen
Submit erreichen
Cancel oder Close erreichen
Dialog schließen
weiter navigieren
```

---

## Test mit Browser-Konsole

Vor Review prüfen:

```text
keine unbehandelten Errors
keine Asset-404
keine Form-Submit-Fehler
keine ExpressionChanged-Fehler
keine Debug-Logs
```

---

## Häufige Fehler vermeiden

### Klickbare divs

Falsch:

```html
<div (click)="openDialog()">
  Add Task
</div>
```

Richtig:

```html
<button
  type="button"
  (click)="openDialog()"
>
  Add Task
</button>
```

---

### Kein aria-label bei Icon-Button

Falsch:

```html
<button>
  <img src="assets/icons/close.svg" alt="" />
</button>
```

Richtig:

```html
<button
  type="button"
  aria-label="Close dialog"
>
  <img src="assets/icons/close.svg" alt="" />
</button>
```

---

### Focus entfernen

Falsch:

```scss
button:focus {
  outline: none;
}
```

Richtig:

```scss
button:focus-visible {
  outline: 2px solid #29abe2;
  outline-offset: 2px;
}
```

---

### Dialog nicht scrollbar

Falsch:

```text
Dialoginhalt wird auf kleinen Viewports abgeschnitten.
```

Richtig:

```text
Dialoginhalt scrollt intern.
Close und Aktionen bleiben erreichbar.
```

---

### Fehler nur über Farbe zeigen

Falsch:

```text
Input nur rot markieren.
```

Richtig:

```text
Input markieren und Fehlermeldung anzeigen.
```

---

## Review-Checkliste

Vor Review prüfen:

```text
[ ] Navigation per Tastatur möglich
[ ] Focus sichtbar
[ ] Buttons sind echte Buttons
[ ] Links sind echte Links
[ ] Icon-Buttons haben aria-label
[ ] dekorative Icons haben leeres alt
[ ] Formularfelder haben Labels
[ ] Fehlermeldungen stehen unter Feldern
[ ] Dialoge sind mobil bedienbar
[ ] Close-Buttons bleiben sichtbar
[ ] Submit-Buttons bleiben sichtbar
[ ] Drag-and-drop hat mobile oder klickbare Alternative
[ ] keine horizontalen Scrollbalken
[ ] keine wichtigen UI-Elemente verdeckt
```

---

## Zusammenfassung

Accessibility und UX sorgen dafür, dass Join stabil und verständlich bedienbar bleibt.

Interaktionen werden mit passenden HTML-Elementen umgesetzt.  
Focus-Zustände bleiben sichtbar.  
Dialoge und Formulare bleiben auf allen Viewports bedienbar.  
Fehler und Erfolg werden klar angezeigt.  
Drag-and-drop bekommt eine Alternative für mobile und nicht-mausbasierte Bedienung.

Damit wird die Anwendung nicht nur schöner, sondern auch robuster und review-sicherer.