# State Management

Dieses Dokument beschreibt, wie State im Join-Projekt verwaltet wird. Ziel ist, klar zu trennen, welche Daten zentral in Services liegen und welche Zustände lokal in Components bleiben.

---

## Grundidee

State wird im Projekt bewusst aufgeteilt:

```text
Service-State
→ fachliche Daten, die mehrere Components brauchen

Component-State
→ lokale UI-Zustände, die nur eine Component oder Page betreffen
```

Diese Trennung verhindert, dass Services mit UI-Details überladen werden oder Components eigene Kopien von zentralen Daten pflegen.

---

## Service-State

Service-State liegt in Angular Services und wird über Signals bereitgestellt.

Beispiele:

```typescript
readonly allTasks = signal<Task[]>([]);
readonly selectedTask = signal<Task | null>(null);
readonly allContacts = signal<Contact[]>([]);
readonly selectedContact = signal<Contact | null>(null);
```

Service-State ist sinnvoll, wenn Daten:

```text
von mehreren Components genutzt werden
nach CRUD-Operationen synchron bleiben müssen
einen fachlichen Zustand der Anwendung beschreiben
aus Supabase geladen werden
für mehrere UI-Bereiche relevant sind
```

---

## Component-State

Component-State liegt direkt in der Component.

Beispiele:

```typescript
readonly isCreateDialogOpen = signal(false);
readonly isEditDialogOpen = signal(false);
readonly searchTerm = signal('');
readonly isMobileMenuOpen = signal(false);
```

Component-State ist sinnvoll, wenn der Zustand:

```text
nur die Darstellung betrifft
nur lokal gebraucht wird
beim Schließen der Component verschwinden kann
nicht von anderen Features benötigt wird
keine Datenbankdaten beschreibt
```

---

## Warum diese Trennung wichtig ist

Ohne klare Trennung entstehen schnell doppelte oder widersprüchliche Datenstände.

Schlechtes Beispiel:

```text
ContactService.selectedContact
ContactsPage.selectedContact
ContactDetail.selectedContact
```

Wenn alle drei Werte unabhängig voneinander gepflegt werden, kann die UI unterschiedliche Kontakte anzeigen.

Besser:

```text
ContactService.selectedContact
→ zentrale Quelle

ContactsPage
→ nutzt oder übergibt diesen Wert

ContactDetail
→ zeigt diesen Wert an
```

---

## Single Source of Truth

Für fachliche Daten soll es eine eindeutige Quelle geben.

Beispiele:

```text
Kontaktliste
→ ContactService.allContacts

ausgewählter Kontakt
→ ContactService.selectedContact

Taskliste
→ TaskService.allTasks

ausgewählter Task
→ TaskService.selectedTask

Subtasks des ausgewählten Tasks
→ TaskService.selectedSubtasks

Kontakte des ausgewählten Tasks
→ TaskService.assignedContacts
```

Components sollen diese Daten nicht dauerhaft als eigene Kopie halten, außer sie brauchen bewusst eine temporäre Bearbeitungsversion für ein Formular.

---

## State im ContactService

Der `ContactService` hält:

```typescript
selectedContact
allContacts
```

### `allContacts`

Enthält die aktuelle Kontaktliste.

Wird aktualisiert nach:

```text
createContact()
updateContact()
deleteContact()
```

Der Service hält die Liste sortiert.  
Components müssen die Sortierung nicht erneut selbst übernehmen.

### `selectedContact`

Enthält den aktuell ausgewählten Kontakt.

Wird gesetzt, wenn:

```text
ein Kontakt ausgewählt wird
ein Kontakt erstellt wurde
ein Kontakt aktualisiert wurde
```

Wird geleert, wenn:

```text
der ausgewählte Kontakt gelöscht wurde
```

---

## State im TaskService

Der `TaskService` hält:

```typescript
allTasks
selectedTask
selectedSubtasks
assignedContacts
isLoading
errorMessage
```

### `allTasks`

Enthält die Taskliste für Board und Task-Ansichten.

Wird aktualisiert nach:

```text
getTasks()
createTask()
createTaskWithRelations()
updateTask()
updateTaskWithRelations()
deleteTask()
```

### `selectedTask`

Enthält den aktuell geöffneten oder bearbeiteten Task.

### `selectedSubtasks`

Enthält die Subtasks des aktuell ausgewählten Tasks.

### `assignedContacts`

Enthält die vollständigen Kontaktdaten der Kontakte, die dem aktuell ausgewählten Task zugewiesen sind.

### `isLoading`

Zeigt an, ob aktuell eine Service-Operation läuft.

### `errorMessage`

Enthält eine fachliche Fehlermeldung für Components.

---

## Lokaler UI-State in Pages

Pages koordinieren UI-Zustände, die nur für diesen Bereich gelten.

Beispiele im Kontaktbereich:

```text
Create-Dialog geöffnet
Edit-Dialog geöffnet
Success-Overlay sichtbar
Body-Scroll gesperrt
```

Diese Zustände gehören nicht in den `ContactService`, weil sie nichts über die gespeicherten Kontaktdaten aussagen.

---

## Lokaler UI-State im Board

Die Board Page kann lokalen State halten für:

```text
Suchbegriff
offener Task-Dialog
offener Add-Task-Dialog
Drag-and-drop-Zwischenzustand
lokale Board-Relationsdaten
mobile Move-Menüs
```

Dieser State beschreibt die aktuelle Darstellung des Boards und muss nicht global verfügbar sein.

---

## Lokale Relationsdaten im Board

Das Board kann zusätzliche Relationsdaten lokal halten:

```typescript
readonly subtasks = signal<Subtask[]>([]);
readonly assignments = signal<TaskAssignmentRow[]>([]);
```

Diese Daten kommen aus:

```typescript
loadAllBoardData()
```

Sie werden lokal gehalten, weil sie vor allem für die Board-Darstellung gebraucht werden.

Die Hauptliste der Tasks bleibt trotzdem im Service:

```typescript
readonly tasks = this.taskService.allTasks;
```

---

## Warum Forms eigenen State haben

Formulare haben immer lokalen State.

Beispiele:

```text
FormGroup
FormControls
temporäre Eingabewerte
Touched-Zustände
Validierungsfehler
temporär ausgewählte Kontakte
temporär angelegte Subtasks
```

Diese Daten gehören in die Form-Component, weil sie erst nach Submit fachlich gespeichert werden.

Vor dem Submit ist es nur ein Bearbeitungsstand.

---

## Form-State und Service-State nicht vermischen

Ein Edit-Formular sollte den Service-State nicht bei jeder Eingabe direkt ändern.

Besserer Ablauf:

```text
selectedTask aus Service laden
  ↓
Formular mit Kopie befüllen
  ↓
User bearbeitet Formular lokal
  ↓
Submit
  ↓
Service aktualisiert Daten
  ↓
Service-State wird ersetzt
```

Dadurch verändert sich die Anzeige nicht versehentlich, bevor der User wirklich gespeichert hat.

---

## Signals in Components verwenden

Servicesignals können direkt in Components referenziert werden.

```typescript
readonly tasks = this.taskService.allTasks;
readonly isLoading = this.taskService.isLoading;
readonly errorMessage = this.taskService.errorMessage;
```

Im Template:

```html
@if (isLoading()) {
  <p>Loading...</p>
}

@if (errorMessage()) {
  <p>{{ errorMessage() }}</p>
}
```

---

## Computed State

Abgeleiteter State kann mit `computed()` erzeugt werden.

Beispiel für Suche:

```typescript
readonly filteredTasks = computed(() => {
  return filterTasks(this.taskService.allTasks(), {
    searchTerm: this.searchTerm(),
  });
});
```

`filteredTasks` wird nicht gespeichert, sondern aus vorhandenem State berechnet.

Das ist sinnvoll, weil der gefilterte Zustand jederzeit aus `allTasks` und `searchTerm` neu berechnet werden kann.

---

## Wann `computed()` sinnvoll ist

`computed()` ist sinnvoll für Daten, die:

```text
aus anderem State berechnet werden
nicht separat gespeichert werden müssen
sich automatisch aktualisieren sollen
keine Seiteneffekte auslösen
```

Beispiele:

```text
gefilterte Tasks
Tasks einer bestimmten Spalte
Subtasks eines Tasks
Subtask-Fortschritt
Kontaktinitialen für Anzeige
```

---

## Wann kein `computed()` nötig ist

Kein `computed()` ist nötig, wenn ein Wert:

```text
nur einmal bei einem Event gebraucht wird
asynchron aus Supabase geladen wird
direkt gesetzt werden muss
ein Formularwert ist
```

---

## State nach Create

Nach einem erfolgreichen Create aktualisiert der Service den zentralen State.

Beispiel Kontakt:

```text
Kontakt wird erstellt
  ↓
Kontakt wird in allContacts eingefügt
  ↓
Liste wird sortiert
  ↓
selectedContact wird auf neuen Kontakt gesetzt
```

Beispiel Task:

```text
Task wird erstellt
  ↓
Task wird in allTasks eingefügt
  ↓
selectedTask wird auf neuen Task gesetzt
```

Die Component muss danach nur noch UI-Folgen steuern:

```text
Dialog schließen
Formular leeren
Success anzeigen
Board neu laden, falls lokale Relationsdaten betroffen sind
```

---

## State nach Update

Nach einem Update ersetzt der Service den vorhandenen Datensatz im State.

```text
alter Task
  ↓
updatedTask
  ↓
replaceTask()
  ↓
allTasks aktualisieren
```

Wenn der aktualisierte Task aktuell ausgewählt ist, wird auch `selectedTask` ersetzt.

Bei Kontakten gilt dasselbe Prinzip mit `selectedContact`.

---

## State nach Delete

Nach einem Delete entfernt der Service den Datensatz aus dem State.

Beispiel:

```text
deleteTask(id)
  ↓
Task aus allTasks entfernen
  ↓
wenn selectedTask betroffen ist:
    selectedTask leeren
    selectedSubtasks leeren
    assignedContacts leeren
```

Dadurch bleibt die UI konsistent und zeigt keine gelöschten Daten an.

---

## Fehler-State

Der `TaskService` verwendet:

```typescript
errorMessage
```

Vor einem neuen Request wird die alte Fehlermeldung geleert.

```text
Request startet
  ↓
errorMessage = ''
```

Wenn ein Fehler passiert:

```text
errorMessage = passende Meldung
Fehler wird weitergeworfen
```

Die Component kann die Meldung anzeigen und zusätzlich im `catch` lokales Verhalten steuern.

---

## Loading-State

Der `TaskService` verwendet:

```typescript
isLoading
```

Ablauf:

```text
Request startet
  ↓
isLoading = true

Request endet
  ↓
isLoading = false
```

Components nutzen diesen Zustand für:

```text
Buttons deaktivieren
Loader anzeigen
Doppel-Submit verhindern
```

---

## Gemeinsamer Loading-State

Ein gemeinsamer Loading-State ist einfach, aber nicht immer perfekt.

Wenn mehrere Requests parallel laufen, kann ein einzelnes `isLoading` ungenau werden.

Für den aktuellen Projektstand reicht ein gemeinsames Signal aus, weil die meisten Service-Aktionen bewusst einzeln ausgeführt werden.

Bei komplexeren Features könnte später getrennt werden:

```text
isLoadingTasks
isSavingTask
isDeletingTask
isLoadingDetails
```

---

## Optimistische Updates

Bei Drag-and-drop kann die UI zuerst lokal aktualisiert werden, bevor Supabase bestätigt.

Ablauf:

```text
aktuellen Zustand merken
UI lokal ändern
Service speichert Änderung
bei Erfolg Zustand behalten
bei Fehler alten Zustand wiederherstellen oder Board neu laden
```

Beispiel:

```typescript
const previousTasks = this.tasks();

this.updateTaskLocally(task.id, targetStatus);

try {
  await this.taskService.updateTask(task.id, {
    status: targetStatus,
  });
} catch (error) {
  this.tasks.set(previousTasks);
}
```

Optimistische Updates gehören in die Component, weil sie die Darstellung betreffen.

---

## Keine doppelten Quellen

Doppelte Quellen führen zu Fehlern.

Schlecht:

```text
Board hält eigene vollständige Taskliste
TaskService hält allTasks
TaskCard lädt Task nochmal selbst
```

Besser:

```text
TaskService.allTasks
→ zentrale Taskliste

Board
→ filtert und gruppiert

TaskCard
→ bekommt einzelne Task per Input
```

---

## Wann lokale Kopien erlaubt sind

Lokale Kopien sind erlaubt, wenn sie bewusst temporär sind.

Beispiele:

```text
Formularwerte beim Editieren
alter Board-State für Rollback
lokale Drag-and-drop-Reihenfolge
lokale Suchergebnisse
```

Wichtig ist: Nach Abschluss muss klar sein, ob die Kopie verworfen oder mit dem Service-State synchronisiert wird.

---

## Parent-Child-State

Child-Components sollen nicht unnötig globalen State ändern.

Besser:

```text
Child erhält Daten per Input.
Child meldet Aktion per Output.
Parent entscheidet.
Parent ruft Service auf.
```

Beispiel:

```typescript
task = input.required<Task>();
taskSelected = output<string>();
```

Dadurch bleibt die Child-Component unabhängig vom Service.

---

## Direktes Setzen von Service-State

Direktes Setzen von Service-State ist nur sinnvoll, wenn es fachlich klar ist.

Beispiel:

```typescript
this.contactService.selectedContact.set(contact);
```

Das ist im Kontaktbereich sinnvoll, weil der ausgewählte Kontakt ein zentraler Zustand ist.

Nicht sinnvoll:

```typescript
this.taskService.allTasks.set(localDraggedTasks);
```

wenn es nur ein temporärer Drag-and-drop-Zustand ist.

---

## State und Reload

Persistente Daten müssen nach einem Reload wieder aus Supabase aufgebaut werden können.

Das betrifft:

```text
Tasks
Subtasks
Kontaktzuweisungen
Kontakte
```

Nicht persistent sein müssen:

```text
offener Dialog
Suchbegriff
mobile Menüanimation
Success-Overlay
Formular-Touched-State
```

---

## Entscheidungshilfe

| Frage | State gehört wohin? |
|---|---|
| Wird der Zustand von mehreren Components gebraucht? | Service |
| Beschreibt der Zustand Daten aus Supabase? | Service |
| Wird der Zustand nach CRUD geändert? | Service |
| Ist es nur ein geöffneter Dialog? | Component |
| Ist es nur ein Formularzustand? | Component |
| Ist es nur eine Animation oder ein Menü? | Component |
| Ist es ein Suchbegriff? | Component |
| Ist es ein berechneter Wert? | `computed()` oder Utility |
| Ist es ein temporärer Rollback-Zustand? | Component |

---

## Häufige Fehler vermeiden

### Service nicht mit UI-State überladen

Falsch:

```typescript
readonly isEditDialogOpen = signal(false);
```

im Service.

Richtig:

```typescript
readonly isEditDialogOpen = signal(false);
```

in der Page-Component.

---

### Keine dauerhaften lokalen Kopien von Service-Daten

Falsch:

```typescript
readonly localTasks = signal<Task[]>([]);
```

als dauerhafte zweite Taskliste neben `TaskService.allTasks`.

Richtig:

```typescript
readonly tasks = this.taskService.allTasks;
```

---

### Formulare nicht direkt auf Service-State schreiben lassen

Falsch:

```text
jede Eingabe verändert sofort selectedTask
```

Richtig:

```text
Formular hält lokalen Bearbeitungsstand
Submit aktualisiert über Service
```

---

### Fehler-State nicht ignorieren

Service-Fehler sollten von Components genutzt oder bewusst behandelt werden.

```typescript
readonly errorMessage = this.taskService.errorMessage;
```

---

### Loading-State nicht nur optisch verwenden

Loading-State sollte auch Doppel-Submits verhindern.

```html
<button [disabled]="isLoading()">
  Save
</button>
```

---

## Zusammenfassung

State wird im Join-Projekt nach Verantwortung getrennt.

Services halten fachliche Daten und gemeinsamen Zustand.  
Components halten lokale UI-Zustände, Formulare und temporäre Darstellungsdaten.  
Berechnete Werte werden aus vorhandenem State abgeleitet und nicht unnötig gespeichert.

Diese Trennung sorgt dafür, dass Daten synchron bleiben, Components verständlich bleiben und Services nicht mit UI-Details überladen werden.