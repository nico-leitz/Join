# Formulare und Validierung

Dieses Dokument beschreibt, wie Formulare und Validierungen im Join-Projekt umgesetzt werden. Ziel ist, dass Formulare einheitlich funktionieren, ungültige Eingaben sauber abgefangen werden und Services nur gültige Payloads erhalten.

---

## Grundregel

Formularlogik liegt in Components.

```text
Formular aufbauen
Eingaben validieren
Fehlermeldungen anzeigen
Submit verhindern
Payload erzeugen
```

Services speichern Daten, validieren aber nicht die komplette UI-Form.

```text
Component
  ↓
validiert Formular
  ↓
erzeugt Create- oder Update-Input
  ↓
Service speichert
```

---

## Verantwortlichkeiten

### Component

Die Component ist zuständig für:

```text
FormGroup
FormControls
Validatoren
Touched-State
Fehlermeldungen
Submit-Button-State
lokale Formularwerte
Payload-Erzeugung
```

### Service

Der Service ist zuständig für:

```text
Speichern
Aktualisieren
Löschen
Mapping
State aktualisieren
Fehler weitergeben
```

Der Service soll keine HTML-Formularzustände kennen.

---

## Keine native Browservalidierung

Wenn eigene Validierung verwendet wird, sollen native Browsermeldungen vermieden werden.

Im Formular:

```html
<form
  novalidate
  (ngSubmit)="submit()"
>
  ...
</form>
```

Dadurch erscheinen keine uneinheitlichen Browser-Popups.

Fehlermeldungen werden stattdessen kontrolliert im Template angezeigt.

---

## Submit-Grundmuster

Ein Submit prüft zuerst das Formular.

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  await this.save();
}
```

Wichtig:

```text
ungültiges Formular wird nicht gespeichert
alle Fehler werden sichtbar
Service wird nur bei gültigen Daten aufgerufen
```

---

## Fehlermeldungen

Fehlermeldungen stehen direkt unter dem betroffenen Feld.

```html
@if (isFieldInvalid('title')) {
  <p class="form-field__error">
    This field is required.
  </p>
}
```

Ein Input mit Fehler bekommt zusätzlich einen sichtbaren Fehlerzustand.

```html
<input
  [class.form-field__input--invalid]="isFieldInvalid('title')"
/>
```

---

## Wann ein Fehler sichtbar ist

Ein Fehler soll sichtbar sein, wenn:

```text
Feld wurde berührt
oder Formular wurde submitted
und Feld ist ungültig
```

Beispiel:

```typescript
isFieldInvalid(controlName: string): boolean {
  const control = this.form.get(controlName);

  return Boolean(
    control &&
    control.invalid &&
    (control.touched || this.wasSubmitted())
  );
}
```

---

## Platz für Fehlermeldungen

Formulare sollen Platz für Fehlermeldungen einplanen.

Ziel:

```text
keine starken Layoutsprünge
Buttons werden nicht überdeckt
Dialog bleibt bedienbar
Fehlermeldung ist lesbar
```

Besonders wichtig auf mobilen Viewports.

---

## Kontaktformular

Kontaktformulare werden verwendet für:

```text
Kontakt erstellen
Kontakt bearbeiten
```

Pflichtfelder:

```text
Name
E-Mail
Telefon
```

Je nach Figma-Stand kann Telefon optional wirken. Wenn es im Formular Pflicht ist, muss es auch validiert werden. Wenn es optional ist, wird ein leerer Wert als `null` gespeichert.

---

## Name validieren

Namen dürfen keine Zahlen enthalten.

Erlaubt sind:

```text
Buchstaben
Umlaute
Leerzeichen
Bindestrich
Apostroph
```

Beispiel-Pattern:

```typescript
private readonly namePattern =
  /^[A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß' -]+$/;
```

Ungültig:

```text
Max1
Anna123
Test!
```

Gültig:

```text
Max Mustermann
Anna-Lena
O'Connor
Müller
```

---

## Einzelner Name

Wenn nur ein einzelner Name eingegeben wird, wird der Nachname mit einem Fallback ergänzt.

```text
Eingabe:
Max

Ergebnis:
firstName = Max
lastName = Unknown
```

Der Fallback verhindert unvollständige Kontaktdaten.

```typescript
private readonly fallbackLastName = 'Unknown';
```

---

## Name in Vor- und Nachname teilen

Wenn das Formular ein einzelnes Namensfeld verwendet, wird die Eingabe getrennt.

Beispiel:

```text
"Max Mustermann"
→ firstName: "Max"
→ lastName: "Mustermann"
```

Bei mehreren Namensbestandteilen kann der erste Teil als Vorname und der Rest als Nachname verwendet werden.

```text
"Max Paul Mustermann"
→ firstName: "Max"
→ lastName: "Paul Mustermann"
```

---

## E-Mail validieren

E-Mail-Adressen müssen ein gültiges Format haben.

Beispiele gültig:

```text
max@example.com
anna.lena@example.de
```

Beispiele ungültig:

```text
max
max@
@example.com
```

Die Validierung erfolgt im Formular, bevor der Service aufgerufen wird.

---

## Telefonnummer validieren

Telefonnummern dürfen enthalten:

```text
Ziffern
Leerzeichen
optional führendes +
```

Beispiel-Pattern:

```typescript
private readonly phonePattern = /^\+?[0-9 ]+$/;
```

Gültig:

```text
+491701234567
0170 1234567
0201 123456
```

Ungültig:

```text
0170-123456
abc123
+49 (0) 170
```

---

## Telefonnummer speichern

Leere Telefonnummern werden als `null` gespeichert, wenn das Feld optional ist.

```text
'' → null
```

Dadurch entstehen keine unnötigen leeren Strings in der Datenbank.

---

## CreateContact Payload

Das Kontaktformular erzeugt ein `CreateContact`.

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}
```

Die Component erzeugt keine Datenbankfelder.

Nicht verwenden:

```typescript
first_name
last_name
badge_color
```

Diese Umwandlung übernimmt der Service.

---

## UpdateContact Payload

Beim Bearbeiten wird ein `UpdateContact` erzeugt.

```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
}
```

Nur geänderte oder bewusst gesetzte Felder werden an den Service übergeben.

---

## Add-Task-Formular

Das Add-Task-Formular erstellt neue Tasks.

Pflichtfelder:

```text
Titel
Fälligkeitsdatum
Kategorie
```

Optionale Felder:

```text
Beschreibung
Priorität
Subtasks
Kontaktzuweisungen
```

Standardwerte:

```text
priority = medium
status = todo
```

---

## Titel validieren

Der Titel darf nicht leer sein.

Ungültig:

```text
''
'   '
```

Vor dem Speichern wird der Wert getrimmt.

```text
'  Task erstellen  '
→ 'Task erstellen'
```

---

## Beschreibung

Die Beschreibung kann optional sein.

Wenn eine Beschreibung eingegeben wird, wird sie getrimmt.

```text
'  Beschreibung  '
→ 'Beschreibung'
```

Ein leerer Wert kann als leerer String oder `null` behandelt werden, abhängig vom Model. Wichtig ist, dass die Behandlung im Payload-Mapper einheitlich bleibt.

---

## Fälligkeitsdatum

Das Fälligkeitsdatum ist Pflicht.

Zusätzlich soll ein Datum in der Vergangenheit verhindert werden.

Prüfen:

```text
Datum vorhanden
Datum ist heute oder in der Zukunft
```

Ungültig:

```text
leeres Datum
Datum vor heute
```

Gültig:

```text
heute
morgen
späteres Datum
```

---

## Kategorie

Die Kategorie ist Pflicht.

Erlaubte Werte:

```text
technical_task
user_story
```

Das UI kann diese Werte mit Anzeigenamen darstellen:

```text
Technical Task
User Story
```

Gespeichert wird der technische Wert.

---

## Priorität

Erlaubte Werte:

```text
urgent
medium
low
```

Wenn der User nichts auswählt, wird `medium` verwendet.

Die Priorität soll immer einen definierten Wert haben.

---

## Kontakte auswählen

Kontaktzuweisungen werden im Formular als Kontakt-IDs gesammelt.

```typescript
contactIds: string[]
```

Nicht speichern:

```typescript
assignedContacts: Contact[]
```

Die vollständigen Kontaktdaten sind nur für die Anzeige relevant.  
Gespeichert wird die Beziehung in `task_assignments`.

---

## Subtasks im Add-Formular

Neue Subtasks haben beim Erstellen noch keine ID und keine `taskId`.

Die Component übergibt nur:

```typescript
{
  title: string;
  sortOrder?: number;
}
```

Die `taskId` wird erst im Service ergänzt, nachdem der Task erstellt wurde.

---

## Subtask validieren

Ein Subtask-Titel darf nicht leer sein.

Ungültig:

```text
''
'   '
```

Gültig:

```text
Design prüfen
Datenbank testen
Board anbinden
```

Leere Subtasks sollen nicht gespeichert werden.

---

## Enter-Verhalten bei Subtasks

Wenn im Subtask-Feld Enter gedrückt wird, soll nicht das komplette Task-Formular abgeschickt werden.

Stattdessen:

```text
Enter im Subtask-Feld
→ Subtask zur lokalen Liste hinzufügen
→ Hauptformular bleibt offen
```

Der Haupttask wird nur über den Submit-Button oder den echten Formular-Submit gespeichert.

---

## CreateTaskWithRelationsInput

Das Add-Task-Formular erzeugt:

```typescript
{
  task: {
    title: string;
    description?: string;
    dueDate: string;
    priority?: TaskPriority;
    category: TaskCategory;
    status?: TaskStatus;
    sortOrder?: number;
  },
  subtasks?: {
    title: string;
    sortOrder?: number;
  }[],
  contactIds?: string[];
}
```

Die Component verwendet `camelCase`.

Die Datenbank-Payloads entstehen später im Payload-Mapper.

---

## Edit-Task-Formular

Das Edit-Task-Formular aktualisiert bestehende Tasks.

Es erzeugt ein:

```typescript
UpdateTaskWithRelationsInput
```

Dieses kann enthalten:

```text
Task-Daten
Subtasks
Kontakt-IDs
```

---

## Wichtig: undefined und leere Arrays

Bei Updates ist der Unterschied wichtig.

```text
subtasks: undefined
→ Subtasks bleiben unverändert

subtasks: []
→ alle Subtasks löschen

contactIds: undefined
→ Kontaktzuweisungen bleiben unverändert

contactIds: []
→ alle Kontaktzuweisungen löschen
```

Die Component muss bewusst entscheiden, ob ein Bereich geändert wurde.

---

## Bestehende Subtasks bearbeiten

Bestehende Subtasks haben eine ID.

```typescript
{
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder?: number;
}
```

Wenn die ID vorhanden ist, kann der Service den Subtask aktualisieren.

---

## Neue Subtasks im Edit-Formular

Neue Subtasks haben keine ID.

```typescript
{
  title: string;
  isCompleted?: boolean;
  sortOrder?: number;
}
```

Der Service erkennt daran, dass ein neuer Subtask erstellt werden muss.

---

## Entfernte Subtasks

Wenn ein Subtask im Edit-Formular entfernt wurde, fehlt er im finalen Subtask-Array.

Der Service löscht dann Subtasks, die vorher vorhanden waren, aber im neuen Endzustand fehlen.

Die Component soll nicht selbst löschen.

Sie beschreibt nur den gewünschten Endzustand.

---

## Kontaktzuweisungen im Edit-Formular

Das Edit-Formular übergibt die gewünschte finale Liste von Kontakt-IDs.

```typescript
contactIds: this.selectedContactIds()
```

Der Service berechnet daraus:

```text
welche Zuweisungen neu sind
welche Zuweisungen bleiben
welche Zuweisungen entfernt werden
```

---

## Submit-Button

Submit-Buttons sollen deaktiviert werden, wenn:

```text
Formular ungültig ist
oder gerade gespeichert wird
```

Beispiel:

```html
<button
  type="submit"
  [disabled]="form.invalid || isLoading()"
>
  Save
</button>
```

Dadurch werden Doppel-Submits verhindert.

---

## Cancel-Button

Cancel schließt den Dialog oder setzt das Formular zurück.

Cancel speichert nichts.

```text
Cancel
→ keine Service-Methode
→ Formularzustand verwerfen
→ Dialog schließen oder Seite zurücksetzen
```

---

## Delete-Button

Delete ist keine Formularvalidierung.

Delete wird als eigene Aktion behandelt.

```text
User klickt Delete
  ↓
Component sendet deleteRequested
  ↓
Parent ruft Service.delete...
```

Falls eine Bestätigung vorgesehen ist, gehört sie in UI-Logik der Component oder Page.

---

## Success nach Submit

Nach erfolgreichem Speichern kann die Component:

```text
Dialog schließen
Formular zurücksetzen
Success-Overlay anzeigen
zum Board navigieren
Board neu laden
```

Der Service entscheidet nicht über diese UI-Folgen.

---

## Fehler nach Submit

Wenn Speichern fehlschlägt:

```text
Dialog bleibt offen
Formulardaten bleiben erhalten
Fehlermeldung wird angezeigt
User kann korrigieren oder erneut versuchen
```

Service-Fehler werden in der Component mit `try/catch` behandelt.

```typescript
try {
  await this.taskService.createTaskWithRelations(input);
} catch (error) {
  console.error('Task could not be saved.', error);
}
```

---

## Accessibility

Formulare sollen barrierearm aufgebaut sein.

Wichtig:

```text
label für jedes Eingabefeld
Fehlermeldung unter dem Feld
sichtbarer Focus-State
Buttons statt klickbarer divs
aria-label bei Icon-Buttons
logische Tab-Reihenfolge
```

Beispiel:

```html
<label for="task-title">
  Title
</label>

<input
  id="task-title"
  type="text"
  formControlName="title"
/>
```

---

## Testbare Kontaktformular-Flows

Prüfen:

```text
leeres Formular verhindert Submit
Name mit Zahl wird abgelehnt
Name mit Umlaut wird akzeptiert
einzelner Name setzt lastName = Unknown
ungültige E-Mail wird abgelehnt
gültige E-Mail wird akzeptiert
ungültige Telefonnummer wird abgelehnt
gültige Telefonnummer wird akzeptiert
Kontakt wird erstellt
Kontakt wird aktualisiert
Fehlermeldungen erscheinen unter Feldern
Submit erzeugt keine nativen Browsermeldungen
```

---

## Testbare Add-Task-Flows

Prüfen:

```text
leerer Titel verhindert Submit
fehlendes Datum verhindert Submit
vergangenes Datum wird abgelehnt
fehlende Kategorie verhindert Submit
Standardpriorität ist medium
Standardstatus ist todo
Kontakte können ausgewählt werden
Subtasks können hinzugefügt werden
leere Subtasks werden nicht gespeichert
Enter im Subtaskfeld erstellt nur Subtask
Task wird mit Subtasks gespeichert
Task wird mit Kontaktzuweisungen gespeichert
Daten bleiben nach Reload erhalten
```

---

## Testbare Edit-Task-Flows

Prüfen:

```text
bestehende Daten werden geladen
Titel kann geändert werden
Beschreibung kann geändert werden
Datum kann geändert werden
Priorität kann geändert werden
Kategorie kann geändert werden
Kontaktzuweisungen können geändert werden
Subtasks können hinzugefügt werden
Subtasks können bearbeitet werden
Subtasks können entfernt werden
undefined lässt Relationen unverändert
leeres Array löscht Relationen bewusst
Änderungen bleiben nach Reload erhalten
```

---

## Häufige Fehler vermeiden

### Service bei ungültigem Formular aufrufen

Falsch:

```typescript
await this.taskService.createTaskWithRelations(input);
```

ohne vorherige Formularprüfung.

Richtig:

```typescript
if (this.form.invalid) {
  this.form.markAllAsTouched();
  return;
}
```

---

### Datenbankfelder im Formularpayload

Falsch:

```typescript
due_date: value
sort_order: index
```

Richtig:

```typescript
dueDate: value
sortOrder: index
```

---

### Leeres Array unbewusst setzen

Falsch:

```typescript
subtasks: []
```

obwohl Subtasks nicht bearbeitet wurden.

Richtig:

```typescript
subtasks: undefined
```

wenn der Bereich unverändert bleiben soll.

---

### Dialog nach Fehler schließen

Falsch:

```text
Fehler beim Speichern
→ Dialog schließt trotzdem
```

Richtig:

```text
Fehler beim Speichern
→ Dialog bleibt offen
→ Meldung anzeigen
```

---

## Zusammenfassung

Formulare sind UI-Logik und bleiben in Components.

Die Component validiert Eingaben, zeigt Fehlermeldungen und erzeugt fachliche Payloads.  
Der Service bekommt nur gültige Daten und übernimmt Speicherung, Mapping und State-Updates.

Wichtig ist besonders die saubere Trennung zwischen Formularzustand, Service-State und Datenbank-Payloads.