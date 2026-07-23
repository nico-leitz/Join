# Task- und Board-Components

Dieses Dokument beschreibt die Components im Task- und Board-Bereich. Ziel ist, klar festzulegen, welche Component welche Verantwortung hat und wie sie mit dem `TaskService` zusammenarbeitet.

Die Components sind für Darstellung und Benutzerinteraktion zuständig. Der `TaskService` übernimmt Datenlogik, Supabase-Zugriffe über das Repository, Mapping, Relationslogik und gemeinsamen State.

---

## Überblick

Der Task- und Board-Bereich besteht fachlich aus:

```text
Board Page
Task Card
Task Detail Dialog
Add Task Page
Add Task Dialog
Add Task Details
Board Details
```

Je nach finaler Umsetzung können einzelne Namen leicht abweichen. Die Zuständigkeiten bleiben aber gleich.

---

## Grundregel

Task-Components greifen nicht direkt auf Supabase zu.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

Der Service stellt die öffentliche Schnittstelle für Tasks, Subtasks und Kontaktzuweisungen bereit.

---

## Verantwortlichkeiten

### Components

Components sind zuständig für:

- HTML und Darstellung
- Formularzustand
- Formularvalidierung
- Dialoge öffnen und schließen
- Drag-and-drop auswerten
- lokale UI-Zustände
- Sucheingaben
- Lade- und Fehlerfeedback
- Übergabe von Daten an Child-Components
- Verarbeitung von Events aus Child-Components

### TaskService

Der `TaskService` ist zuständig für:

- Tasks laden und speichern
- Subtasks laden und synchronisieren
- Kontaktzuweisungen laden und synchronisieren
- Task-State mit Signals halten
- Fehlerstatus setzen
- kombinierte Create- und Update-Abläufe
- Cleanup nach fehlgeschlagenem Create-Flow
- Wiederherstellung nach fehlgeschlagenem Update

---

## Board Page

Die Board Page ist die zentrale Component für die Kanban-Ansicht.

Sie zeigt Tasks in vier Spalten:

```text
todo
in_progress
awaiting_feedback
done
```

Die sichtbaren Spalten heißen im UI:

```text
To do
In progress
Await feedback
Done
```

---

## Aufgaben der Board Page

Die Board Page ist zuständig für:

- Board-Daten laden
- Tasks nach Status gruppieren
- Spalten anzeigen
- Suche verwalten
- Drag-and-drop behandeln
- Task-Detaildialog öffnen
- Add-Task-Dialog öffnen
- Task-Karten mit Daten versorgen
- lokale Board-Relationen halten
- UI nach Änderungen aktualisieren

Die Board Page ist nicht zuständig für:

- Supabase-Abfragen
- Payload-Mapping
- Speichern von `task_assignments`
- Synchronisieren von Subtasks
- Erzeugen von Datenbank-Rows

---

## Board-Daten laden

Das Board benötigt drei Datenbereiche:

```text
Tasks
Subtasks
Kontaktzuweisungen
```

Der empfohlene Ablauf:

```typescript
async loadBoard(): Promise<void> {
  try {
    await this.taskService.getTasks();

    const relations =
      await this.taskService.loadAllBoardData();

    this.subtasks.set(relations.subtasks);
    this.assignments.set(relations.assignments);
  } catch (error) {
    console.error('Board could not be loaded.', error);
  }
}
```

`getTasks()` lädt die eigentlichen Task-Karten.  
`loadAllBoardData()` lädt Subtasks und Assignment-Rows für das Board.

---

## Warum das Board Relationsdaten separat hält

Tasks, Subtasks und Kontaktzuweisungen liegen getrennt in der Datenbank.

Das Board arbeitet deshalb mit:

```text
Task[]
Subtask[]
TaskAssignmentRow[]
```

Die Zuordnung passiert über IDs:

```text
Task.id
Subtask.taskId
TaskAssignmentRow.task_id
```

Dadurch muss nicht für jede Task-Karte eine eigene Datenbankabfrage ausgeführt werden.

---

## Tasks nach Status filtern

Eine Spalte zeigt nur Tasks mit passendem Status.

```typescript
getTasksByStatus(status: TaskStatus): Task[] {
  return this.tasks().filter((task) => {
    return task.status === status;
  });
}
```

Die Sortierung der geladenen Tasks kommt aus der Datenebene.  
Bei Drag-and-drop kann die Board Page zusätzlich lokal neu sortieren.

---

## Suche im Board

Die Suche ist lokale UI-Logik.

Sie verändert keine Datenbankdaten.

Gesucht wird in:

```text
title
description
```

Beispiel:

```typescript
readonly filteredTasks = computed(() => {
  return filterTasks(this.taskService.allTasks(), {
    searchTerm: this.searchTerm(),
  });
});
```

Die Suche kann danach mit dem Statusfilter der jeweiligen Spalte kombiniert werden.

---

## Task Card

Die Task Card zeigt eine einzelne Aufgabe im Board.

Sie bekommt ihre Daten von der Board Page.

Typische Inputs:

```typescript
task
subtasks
assignedContacts
```

Die Task Card soll keine Daten selbst laden.

---

## Aufgaben der Task Card

Die Task Card ist zuständig für:

- Kategorie anzeigen
- Titel anzeigen
- Beschreibungsvorschau anzeigen
- Subtask-Fortschritt anzeigen
- zugewiesene Kontaktbadges anzeigen
- Priorität anzeigen
- Klick auf Karte melden
- Drag-Handle oder Drag-State darstellen

Die Task Card ist nicht zuständig für:

- Task speichern
- Subtasks aus Supabase laden
- Kontaktzuweisungen speichern
- Board-Spalten berechnen
- Detaildialog öffnen

---

## Subtasks in der Task Card

Die Board Page gibt der Task Card nur die Subtasks des jeweiligen Tasks.

```typescript
getSubtasksForTask(taskId: string): Subtask[] {
  return this.subtasks().filter((subtask) => {
    return subtask.taskId === taskId;
  });
}
```

Die Task Card kann daraus den Fortschritt berechnen oder den berechneten Fortschritt als Input erhalten.

---

## Subtask-Fortschritt

Der Fortschritt wird aus der Subtask-Liste berechnet.

```typescript
calculateSubtaskProgress(subtasks)
```

Das Ergebnis enthält:

```text
completed
total
percentage
```

Die Task Card zeigt daraus zum Beispiel:

```text
1/2 Subtasks
50 %
```

Hat ein Task keine Subtasks, ist der Fortschritt `0`.

---

## Kontaktbadges in der Task Card

Kontaktzuweisungen werden nicht direkt im Task gespeichert.

Die dauerhafte Speicherung liegt in:

```text
task_assignments
```

Die Task Card soll aber keine Assignment-Rows anzeigen, sondern fertige Kontaktdaten.

Darum bekommt sie idealerweise:

```typescript
assignedContacts: Contact[]
```

Die Board Page bereitet diese Daten vor.

---

## Kontaktzuweisungen für eine Karte ermitteln

Die Board Page kann zuerst die Kontakt-IDs aus den Assignment-Rows ermitteln.

```typescript
getContactIdsForTask(taskId: string): string[] {
  return this.assignments()
    .filter((assignment) => {
      return assignment.task_id === taskId;
    })
    .map((assignment) => {
      return assignment.contact_id;
    });
}
```

Danach können die passenden Kontakte aus der Kontaktliste gefiltert werden.

Die Task Card bekommt am Ende nur noch fertige Kontakte.

---

## Task-Detaildialog

Der Task-Detaildialog zeigt eine vollständige Aufgabe.

Benötigte Daten:

```text
selectedTask
selectedSubtasks
assignedContacts
```

Diese Daten kommen aus dem `TaskService`.

---

## Task-Details öffnen

Beim Klick auf eine Task Card lädt die Board Page oder Detail-Component die vollständigen Detaildaten.

```typescript
async openTaskDetails(taskId: string): Promise<void> {
  try {
    await this.taskService.getTaskById(taskId);
    await this.taskService.getSubtasksByTaskId(taskId);
    await this.taskService.getAssignedContacts(taskId);

    this.isTaskDialogOpen.set(true);
  } catch (error) {
    console.error('Task details could not be loaded.', error);
  }
}
```

Danach liest der Dialog aus den Service-Signals.

---

## Aufgaben des Task-Detaildialogs

Der Detaildialog ist zuständig für:

- Task vollständig anzeigen
- Subtasks anzeigen
- zugewiesene Kontakte anzeigen
- Priorität und Kategorie anzeigen
- Edit-Aktion anbieten
- Delete-Aktion anbieten
- Close-Aktion melden
- mobile Darstellung steuern

Der Detaildialog soll nicht direkt Supabase nutzen.

---

## Edit aus dem Detaildialog

Der Detaildialog soll das Bearbeiten nicht selbst vollständig koordinieren.

Empfohlener Ablauf:

```text
User klickt Edit
  ↓
Detaildialog sendet Edit-Event
  ↓
Parent öffnet Edit-Modus oder Edit-Dialog
  ↓
Formular erzeugt UpdateTaskWithRelationsInput
  ↓
TaskService.updateTaskWithRelations()
```

Dadurch bleibt die Datenlogik im Service.

---

## Task löschen

Das Löschen wird über den Service ausgeführt.

```typescript
async deleteTask(taskId: string): Promise<void> {
  try {
    await this.taskService.deleteTask(taskId);
    this.closeTaskDialog();
    await this.loadBoard();
  } catch (error) {
    console.error('Task could not be deleted.', error);
  }
}
```

Nach erfolgreichem Löschen entfernt der Service den Task aus `allTasks`.

Wenn der gelöschte Task ausgewählt war, leert der Service auch:

```text
selectedTask
selectedSubtasks
assignedContacts
```

---

## Add Task Page

Die Add Task Page ist für das Erstellen eines neuen Tasks als eigene Seite zuständig.

Sie enthält oder nutzt ein Formular mit:

```text
Titel
Beschreibung
Fälligkeitsdatum
Priorität
Kategorie
Kontakte
Subtasks
```

Die Page erzeugt am Ende ein `CreateTaskWithRelationsInput`.

---

## Add Task Dialog

Der Add Task Dialog verwendet denselben fachlichen Create-Flow wie die Add Task Page.

Der Unterschied ist nur die Darstellung:

```text
Add Task Page
→ eigene Route oder Seite

Add Task Dialog
→ Overlay im Board
```

Die Speicherung bleibt gleich:

```typescript
taskService.createTaskWithRelations(input)
```

---

## Add Task Formular

Das Formular ist Component-Logik.

Die Component ist zuständig für:

- `FormGroup`
- `FormControls`
- Validatoren
- Fehlermeldungen
- ausgewählte Kontakte
- lokale Subtask-Liste
- Submit verhindern bei ungültigen Daten
- Erzeugen des Create-Inputs

Der Service bekommt nur ein fertiges Input-Objekt.

---

## Pflichtfelder im Add Task Formular

Pflichtfelder:

```text
title
dueDate
category
```

Zusätzlich sollte geprüft werden:

```text
dueDate darf nicht in der Vergangenheit liegen
priority hat Standardwert medium
status hat Standardwert todo
```

Subtasks und Kontakte sind optional.

---

## Create-Input erzeugen

Das Add Task Formular erzeugt diese Struktur:

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

Die Component erzeugt keine Datenbank-Payloads mit `snake_case`.

---

## Task mit Relationen erstellen

Beim Submit wird der kombinierte Create-Flow verwendet.

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  try {
    await this.taskService.createTaskWithRelations(
      this.createTaskInput(),
    );

    this.resetForm();
    this.showSuccessMessage();
  } catch (error) {
    console.error('Task could not be created.', error);
  }
}
```

Der Service erstellt zuerst den Task und danach die abhängigen Daten.

---

## Warum Subtasks ohne `taskId` übergeben werden

Beim Erstellen existiert die Task-ID noch nicht.

Deshalb übergibt die Component neue Subtasks nur mit:

```text
title
sortOrder
```

Die `taskId` wird erst im Service ergänzt, nachdem Supabase den Task erstellt und eine ID zurückgegeben hat.

---

## Warum Kontakte als IDs übergeben werden

Kontakte werden nicht im Task gespeichert.

Das Formular übergibt nur:

```typescript
contactIds: string[]
```

Der Service speichert daraus Zeilen in:

```text
task_assignments
```

Das hält Task-Daten und Kontaktzuweisungen sauber getrennt.

---

## Edit Task Formular

Das Edit Task Formular erzeugt ein `UpdateTaskWithRelationsInput`.

Struktur:

```typescript
{
  task: UpdateTask;
  subtasks?: UpdateTaskSubtaskInput[];
  contactIds?: string[];
}
```

Die Component beschreibt den gewünschten Endzustand.  
Der Service entscheidet, welche Datenbankoperationen daraus entstehen.

---

## Wichtig bei Updates

Bei `updateTaskWithRelations()` ist der Unterschied zwischen `undefined` und einem leeren Array wichtig.

```text
subtasks: undefined
→ Subtasks nicht ändern

subtasks: []
→ alle Subtasks entfernen

contactIds: undefined
→ Kontaktzuweisungen nicht ändern

contactIds: []
→ alle Kontaktzuweisungen entfernen
```

Die Component muss diesen Unterschied bewusst setzen.

---

## Bestehende und neue Subtasks im Edit-Formular

Bestehende Subtasks haben eine ID.

```typescript
{
  id: 'subtask-id',
  title: 'Updated title',
  isCompleted: true,
  sortOrder: 0
}
```

Neue Subtasks haben noch keine ID.

```typescript
{
  title: 'New subtask',
  sortOrder: 1
}
```

Der Service erkennt daran, ob ein Subtask aktualisiert oder neu erstellt werden muss.

---

## Kontaktzuweisungen im Edit-Formular

Das Edit-Formular übergibt die gewünschte finale Kontaktliste als IDs.

```typescript
contactIds: this.selectedContactIds()
```

Die Component soll nicht selbst berechnen:

```text
welche Assignments gelöscht werden
welche Assignments neu erstellt werden
```

Das übernimmt der Service über die Synchronisierung.

---

## Add Task Details

`AddTaskDetails` kann als Teil-Component für Formularabschnitte verwendet werden.

Mögliche Aufgaben:

- Priorität auswählen
- Kategorie auswählen
- Fälligkeitsdatum setzen
- Subtasks lokal verwalten
- ausgewählte Kontakte anzeigen
- Eingaben an Parent melden

Diese Component soll nicht speichern.

Sie liefert nur Werte an die Add Task Page oder den Add Task Dialog.

---

## Board Details

`BoardDetails` kann für Detailinformationen im Board genutzt werden.

Mögliche Aufgaben:

- ausgewählte Task-Daten anzeigen
- Subtasks anzeigen
- Kontaktbadges anzeigen
- Edit/Delete-Aktionen melden
- Close-Aktion melden

Auch hier gilt:

```text
Component zeigt an und sendet Events.
Parent oder Page ruft den Service auf.
```

---

## Drag-and-drop

Drag-and-drop ist Board-Logik und bleibt in der Board Page.

Die Component entscheidet:

```text
Startspalte
Zielspalte
Startindex
Zielindex
neue Reihenfolge
```

Persistiert wird über den Service.

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

---

## Mehrere Tasks neu sortieren

Wenn ein Drag-and-drop-Vorgang mehrere Karten betrifft, muss die Board Page die neuen `sortOrder`-Werte berechnen.

Beispiel:

```typescript
private async persistColumnOrder(tasks: Task[]): Promise<void> {
  for (const [index, task] of tasks.entries()) {
    await this.taskService.updateTask(task.id, {
      status: task.status,
      sortOrder: index,
    });
  }
}
```

Der Service speichert nur die übergebenen Werte.  
Die Berechnung der Reihenfolge bleibt in der Board Page.

---

## Optimistische UI

Beim Verschieben kann das Board die UI sofort aktualisieren und danach speichern.

Ablauf:

```text
aktuellen Board-State merken
UI lokal ändern
Änderung speichern
bei Fehler alten State wiederherstellen oder Board neu laden
```

Dadurch fühlt sich Drag-and-drop direkt an, ohne dass die UI auf Supabase warten muss.

---

## Mobile Alternative zu Drag-and-drop

Auf mobilen Geräten kann Drag-and-drop unpraktisch sein.

Eine mobile Alternative kann sein:

```text
Move to
→ To do
→ In progress
→ Await feedback
→ Done
```

Die Component setzt dann denselben Status wie beim Drag-and-drop.

```typescript
await this.taskService.updateTask(task.id, {
  status: selectedStatus,
});
```

Die Speicherung bleibt also identisch.

---

## Ladezustand

Der `TaskService` stellt `isLoading` bereit.

Components verwenden dieses Signal für:

```text
Buttons deaktivieren
Loader anzeigen
Doppel-Submits verhindern
```

Beispiel:

```html
<button
  type="submit"
  [disabled]="isLoading()"
>
  Create Task
</button>
```

---

## Fehleranzeige

Der `TaskService` stellt `errorMessage` bereit.

```html
@if (errorMessage()) {
  <p class="error-message">
    {{ errorMessage() }}
  </p>
}
```

Trotzdem sollten Components Service-Aufrufe mit `try/catch` absichern.

So kann die Component entscheiden, ob ein Dialog offen bleibt oder ein lokaler UI-State zurückgesetzt werden muss.

---

## Kommunikation zwischen Components

Child-Components sollen Aktionen über Outputs melden.

Beispiele:

```text
TaskCard → taskSelected
TaskDetailDialog → editRequested
TaskDetailDialog → deleteRequested
AddTaskForm → submitted
AddTaskForm → cancelled
```

Die Parent-Component entscheidet dann, welche Service-Methode aufgerufen wird.

---

## Inputs für Child-Components

Child-Components bekommen ihre Daten per Input.

Beispiele:

```typescript
task
subtasks
assignedContacts
isLoading
```

Dadurch bleiben Child-Components unabhängig von der Datenquelle.

---

## Keine Datenbankfelder in Components

Components verwenden Application-Models.

Richtig:

```typescript
task.dueDate
task.sortOrder
subtask.taskId
subtask.isCompleted
```

Falsch:

```typescript
task.due_date
task.sort_order
subtask.task_id
subtask.is_completed
```

Die Umwandlung passiert in den Mappern im Core-Bereich.

---

## Keine Relationslogik in Task Cards

Eine Task Card soll nicht wissen, wie `task_assignments` gespeichert wird.

Nicht Aufgabe der Card:

```text
Assignment-Rows laden
Contacts aus Supabase laden
Assignments erstellen oder löschen
```

Aufgabe der Card:

```text
erhaltene Kontakte anzeigen
Badge-Limit beachten
Klicks melden
```

---

## Empfohlener Board-Flow

```text
Board lädt Tasks
  ↓
Board lädt Relationsdaten
  ↓
Board gruppiert Tasks nach Status
  ↓
Board ordnet Subtasks über taskId zu
  ↓
Board ordnet Kontakte über Assignment-Daten zu
  ↓
Task Cards zeigen vorbereitete Daten
```

---

## Empfohlener Add-Task-Flow

```text
User füllt Formular aus
  ↓
Component validiert
  ↓
Component erzeugt CreateTaskWithRelationsInput
  ↓
TaskService.createTaskWithRelations()
  ↓
Task, Subtasks und Assignments werden gespeichert
  ↓
Board wird aktualisiert oder neu geladen
  ↓
Success-Feedback wird angezeigt
```

---

## Empfohlener Edit-Task-Flow

```text
User öffnet Task
  ↓
TaskService lädt Details
  ↓
Formular wird mit vorhandenen Daten befüllt
  ↓
User ändert Daten
  ↓
Component erzeugt UpdateTaskWithRelationsInput
  ↓
TaskService.updateTaskWithRelations()
  ↓
State wird aktualisiert
  ↓
Dialog schließt oder zeigt Fehler
```

---

## Empfohlener Delete-Flow

```text
User klickt Delete
  ↓
Component bestätigt oder sendet Delete-Event
  ↓
Parent ruft TaskService.deleteTask()
  ↓
Task wird gelöscht
  ↓
Subtasks und Assignments werden über Cascade entfernt
  ↓
Board wird aktualisiert
```

Die Kontakte selbst werden nicht gelöscht.

---

## Testbare User-Flows

Nach Änderungen an Task-Components sollten diese Flows geprüft werden:

```text
Board lädt alle Spalten
Tasks erscheinen im richtigen Status
Task Card zeigt Titel, Kategorie und Priorität
Subtask-Fortschritt wird korrekt angezeigt
Kontaktbadges werden korrekt angezeigt
Suche filtert nach Titel und Beschreibung
Task-Detail öffnet sich
Subtasks werden im Detail angezeigt
Kontakte werden im Detail angezeigt
Task kann erstellt werden
Task mit Subtasks kann erstellt werden
Task mit Kontaktzuweisungen kann erstellt werden
Task kann bearbeitet werden
Subtasks können bearbeitet werden
Kontaktzuweisungen können geändert werden
Task kann gelöscht werden
Drag-and-drop speichert Status und Reihenfolge
Reload erhält Board-Zustand
Mobile Alternative zum Verschieben funktioniert
```

---

## Häufige Fehler vermeiden

### Task Card lädt keine eigenen Daten

Falsch:

```text
TaskCard lädt Subtasks oder Kontakte selbst.
```

Richtig:

```text
Board bereitet Daten vor und gibt sie an TaskCard.
```

---

### Add Task speichert keine Kontakte direkt im Task

Falsch:

```typescript
assignedContacts: contacts
```

Richtig:

```typescript
contactIds: selectedContactIds
```

Die Speicherung passiert über `task_assignments`.

---

### Edit Task löscht nicht unbeabsichtigt Relationen

Falsch:

```typescript
subtasks: []
```

verwenden, obwohl Subtasks gar nicht bearbeitet wurden.

Richtig:

```typescript
subtasks: undefined
```

wenn Subtasks unverändert bleiben sollen.

---

### Drag-and-drop berechnet Reihenfolge nicht im Service

Falsch:

```text
TaskService soll wissen, welche Karte in welcher Spalte welchen Index bekommt.
```

Richtig:

```text
Board berechnet Reihenfolge.
TaskService speichert Status und sortOrder.
```

---

### Keine Datenbank-Payloads in Formularen

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

## Abgrenzung zu anderen Dokumenten

Diese Datei beschreibt die Task- und Board-Components.

Für die Service-Logik siehe:

```text
docs/task-service.md
```

Für Models, Mapper, Repository und Utils siehe:

```text
docs/task-data-layer.md
```

Für die konkrete Verwendung des Service siehe:

```text
docs/task-service-integration.md
```

Für Tabellen und Relationsspeicherung siehe:

```text
docs/supabase-database.md
```

---

## Zusammenfassung

Die Task- und Board-Components bilden die sichtbare Oberfläche für Tasks.

Die Board Page gruppiert, sucht und verschiebt Tasks.  
Task Cards zeigen vorbereitete Daten an.  
Add- und Edit-Components erzeugen fachliche Input-Objekte.  
Detaildialoge zeigen ausgewählte Tasks und senden Aktionen weiter.

Gespeichert, geladen, gemappt und synchronisiert wird über den `TaskService` und die darunterliegende Datenebene. Dadurch bleiben Components frei von Supabase-Details und die Logik bleibt nachvollziehbar getrennt.