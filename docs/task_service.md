# TaskService

Der `TaskService` ist die zentrale Anwendungsschicht für Tasks. Er verbindet die UI mit der Supabase-Datenebene, ohne dass Komponenten wissen müssen, wie die Datenbank aufgebaut ist.

Komponenten arbeiten mit fertigen Anwendungsdaten wie `Task`, `Subtask` und `Contact`. Der Service kümmert sich darum, Datenbankzeilen zu laden, sie zu mappen, Relationen zu synchronisieren und den lokalen Zustand aktuell zu halten.

---

## Aufgabe des TaskService

Der Service ist zuständig für:

- Laden von Tasks, Subtasks und Kontaktzuweisungen
- Erstellen, Bearbeiten und Löschen von Tasks
- Erstellen, Bearbeiten und Löschen von Subtasks
- Zuweisen und Entfernen von Kontakten
- kombinierte Abläufe mit Task, Subtasks und Kontakten
- Aktualisieren des lokalen Signal-State
- Fehlerstatus für Komponenten
- Wiederherstellung oder Cleanup bei fehlgeschlagenen Abläufen

Der Service enthält bewusst keine UI-Logik. Dialoge, Formulare, Drag-and-drop und visuelles Feedback bleiben Aufgabe der Komponenten.

---

## Warum mit Rows gearbeitet wird

Die Datenbank ist normalisiert aufgebaut. Ein Task besteht fachlich aus mehreren Teilen, diese liegen aber nicht in einer einzigen Tabelle.

Beteiligte Tabellen:

```text
tasks
subtasks
task_assignments
contacts
```

Ein Task selbst liegt in `tasks`.  
Die Subtasks liegen separat in `subtasks` und sind über `task_id` mit dem Task verbunden.  
Kontaktzuweisungen liegen in `task_assignments` und verbinden einen Task mit einem Kontakt.  
Die Kontaktdaten selbst liegen in `contacts`.

Deshalb lädt der Service nicht einfach ein fertiges verschachteltes Task-Objekt aus Supabase. Stattdessen werden rohe Datenbankzeilen geladen und danach in TypeScript in die Form gebracht, die die Anwendung braucht.

Das hat mehrere Gründe:

- Die Datenbank bleibt sauber normalisiert.
- Task-, Subtask- und Assignment-Daten können unabhängig geändert werden.
- Es entstehen keine doppelten Task-Daten durch Joins über mehrere Relationen.
- Komponenten müssen keine Datenbankstruktur kennen.
- Mapping und Synchronisierung liegen an einer zentralen Stelle.
- Schreiboperationen bleiben gezielt: Task ändern, Subtask ändern oder Assignment ändern.

Kurz gesagt:  
Rows beschreiben, wie Daten gespeichert sind.  
Application Models beschreiben, wie die App mit den Daten arbeitet.

---

## Row-Models und Application-Models

Es gibt bewusst verschiedene Model-Arten.

### Row-Models

Row-Models spiegeln die Supabase-Tabellen wider. Sie verwenden `snake_case`, weil die Datenbankfelder so heißen.

Beispiel:

```typescript
export interface TaskRow {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

Diese Models werden nur in Repository, Mappern und datenbanknaher Logik verwendet.

### Application-Models

Application-Models werden in Angular verwendet. Sie nutzen `camelCase`.

Beispiel:

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

Komponenten sollen nur mit diesen Models arbeiten.

### Persistence-Models

Persistence-Models beschreiben kombinierte Schreiboperationen.

Beispiele:

```typescript
CreateTaskWithRelationsInput
UpdateTaskWithRelationsInput
CreateTaskSubtaskInput
UpdateTaskSubtaskInput
```

Sie werden genutzt, wenn ein Task zusammen mit Subtasks und Kontaktzuweisungen erstellt oder aktualisiert wird.

---

## Datenfluss beim Lesen

Der normale Lesefluss läuft über vier Schichten:

```text
Component
  ↓
TaskService
  ↓
TaskRepository
  ↓
Supabase
```

Danach werden die Daten zurückgemappt:

```text
Supabase Row
  ↓
Mapper
  ↓
Application Model
  ↓
Signal oder Rückgabewert
  ↓
Component
```

Beispiel für `getTasks()`:

```text
TaskService.getTasks()
  ↓
TaskRepository.getTaskRows()
  ↓
TaskRow[]
  ↓
mapTaskRows()
  ↓
Task[]
  ↓
allTasks Signal
```

Die Komponente bekommt dadurch keine Datenbankfelder wie `due_date` oder `sort_order`.

---

## Warum `loadAllBoardData()` Relation-Rows lädt

Für das Board werden neben den Tasks auch Subtasks und Kontaktzuweisungen benötigt.

`loadAllBoardData()` lädt deshalb:

```typescript
getAllSubtaskRows()
getAllAssignmentRows()
```

Die beiden Abfragen laufen parallel über `Promise.all`.

Das ist bewusst getrennt von `getTasks()`. Tasks, Subtasks und Assignments haben unterschiedliche Verantwortungen:

- `tasks` enthält die eigentliche Karte.
- `subtasks` enthält die Checklistenpunkte.
- `task_assignments` enthält nur die Beziehung zwischen Task und Kontakt.

Das Board kann dadurch erst die Tasks laden und anschließend Relationsdaten nach `taskId` zuordnen. Es muss nicht mit einem großen verschachtelten Supabase-Ergebnis arbeiten.

Vorteile:

- Tasks werden nicht mehrfach geladen.
- Subtasks können pro Task gruppiert werden.
- Assignments bleiben einfache Relationsdaten.
- Die Board-Komponente kann gezielt filtern und rendern.
- Änderungen an Subtasks oder Assignments erfordern keinen kompletten Task-Reload.

---

## Repository

Das `TaskRepository` kapselt alle direkten Supabase-Zugriffe.

Es kennt:

```text
tasks
subtasks
task_assignments
```

Das Repository führt aus:

- `select`
- `insert`
- `update`
- `delete`
- Filter über `id`, `task_id` und `contact_id`
- Sortierung nach `sort_order` und `created_at`
- Rückgabe von Datenbankzeilen

Das Repository mappt die meisten Daten nicht selbst in UI-Models. Es gibt Rows zurück, damit der Service entscheiden kann, wie diese Daten weiterverarbeitet werden.

Ausnahme: `getAssignedContacts()` lädt über die Relation die vollständigen Kontaktdaten und gibt bereits `Contact[]` zurück. Das ist sinnvoll, weil die Komponente für ausgewählte Kontakte direkt Kontaktdaten und nicht nur IDs benötigt.

---

## Mapper

Mapper trennen Datenbankstruktur und Anwendung.

### `task.mapper.ts`

Dieser Mapper wandelt Supabase-Daten in Angular-Daten um.

Beispiele:

```text
TaskRow → Task
SubtaskRow → Subtask
ContactRow → Contact
```

Typische Umwandlungen:

```text
due_date     → dueDate
sort_order   → sortOrder
created_at   → createdAt
task_id      → taskId
is_completed → isCompleted
```

### `task-payload.mapper.ts`

Dieser Mapper wandelt Angular-Daten in Supabase-Payloads um.

Beispiele:

```text
CreateTask → Partial<TaskRow>
UpdateTask → Partial<TaskRow>
CreateSubtask → Partial<SubtaskRow>
UpdateSubtask → Partial<SubtaskRow>
contactIds → TaskAssignmentRow[]
```

Außerdem werden dort Eingaben getrimmt und `updated_at` bei Updates gesetzt.

Dadurch entsteht keine doppelte Payload-Logik in Service oder Komponenten.

---

## Lokaler State mit Signals

Der Service hält zentrale Signals für die Task-Daten:

```typescript
allTasks
selectedTask
selectedSubtasks
assignedContacts
isLoading
errorMessage
```

### `allTasks`

Enthält die aktuell geladenen Tasks für das Board.

Wird aktualisiert nach:

- `getTasks()`
- `createTask()`
- `createTaskWithRelations()`
- `updateTask()`
- `updateTaskWithRelations()`
- `deleteTask()`

### `selectedTask`

Enthält den aktuell geöffneten oder bearbeiteten Task.

### `selectedSubtasks`

Enthält die Subtasks des aktuell ausgewählten Tasks.

### `assignedContacts`

Enthält die Kontakte, die dem aktuell ausgewählten Task zugewiesen sind.

### `isLoading` und `errorMessage`

Diese Signals geben Komponenten einen einfachen Zustand für Lade- und Fehleranzeigen.

---

## Task erstellen

Es gibt zwei Create-Varianten.

### `createTask()`

Diese Methode erstellt nur den Task selbst.

Ablauf:

```text
CreateTask
  ↓
Repository.createTask()
  ↓
TaskRow
  ↓
mapTaskRow()
  ↓
Task
  ↓
allTasks + selectedTask aktualisieren
```

Diese Methode reicht aus, wenn keine Subtasks oder Kontaktzuweisungen direkt mitgespeichert werden.

### `createTaskWithRelations()`

Diese Methode erstellt einen vollständigen Task mit optionalen Subtasks und optionalen Kontaktzuweisungen.

Ablauf:

```text
Task erstellen
  ↓
Task-ID merken
  ↓
Subtasks mit dieser Task-ID erstellen
  ↓
Kontakt-IDs bereinigen
  ↓
Assignments erstellen
  ↓
zugewiesene Kontakte laden
  ↓
Signals aktualisieren
```

Die Task-ID wird nach dem Erstellen benötigt, weil Subtasks und Assignments über `task_id` mit dem neuen Task verbunden werden.

---

## Warum `createTaskWithRelations()` ein Rollback hat

Bei kombinierten Abläufen kann ein späterer Schritt fehlschlagen. Beispiel:

```text
Task wurde erstellt
Subtask wurde erstellt
Kontaktzuweisung schlägt fehl
```

Ohne Cleanup würde ein teilweise angelegter Task in der Datenbank bleiben.

Deshalb merkt sich der Service die erzeugte Task-ID. Wenn ein Relationsschritt fehlschlägt, versucht `rollbackCreatedTask()` den neu erstellten Task wieder zu löschen.

Das Rollback ist bewusst als bestmögliches Cleanup gebaut. Schlägt auch das Löschen fehl, wird der ursprüngliche Fehler trotzdem weitergegeben. Die Komponente bekommt dadurch eine klare Fehlermeldung und der Service bleibt kontrollierbar.

---

## Task aktualisieren

Auch beim Aktualisieren gibt es zwei Varianten.

### `updateTask()`

Diese Methode aktualisiert nur die Task-Daten.

Beispiele:

```text
Titel ändern
Status ändern
Priorität ändern
sortOrder ändern
```

Nach dem Update wird der Task im lokalen State ersetzt.

### `updateTaskWithRelations()`

Diese Methode aktualisiert den Task und optional seine Relationen.

Mögliche Teile:

```typescript
task
subtasks
contactIds
```

Wichtig ist der Unterschied zwischen `undefined` und einem leeren Array:

```text
subtasks: undefined
→ Subtasks bleiben unverändert

subtasks: []
→ alle Subtasks werden entfernt

contactIds: undefined
→ Kontaktzuweisungen bleiben unverändert

contactIds: []
→ alle Kontaktzuweisungen werden entfernt
```

Dadurch kann eine Komponente gezielt entscheiden, welche Daten wirklich geändert werden sollen.

---

## Subtasks synchronisieren

Die Methode `synchronizeTaskSubtasks()` gleicht den gewünschten Subtask-Zustand mit dem aktuellen Datenbankstand ab.

Ablauf:

```text
aktuelle Subtasks aus Supabase laden
  ↓
aktuelle IDs sammeln
  ↓
angefragte IDs aus dem Formular sammeln
  ↓
IDs validieren
  ↓
bestehende Subtasks aktualisieren
  ↓
neue Subtasks erstellen
  ↓
entfernte Subtasks löschen
```

### Warum die IDs validiert werden

Ein Update darf nur Subtasks ändern, die wirklich zum aktuellen Task gehören.

Deshalb prüft der Service:

- doppelte Subtask-IDs sind nicht erlaubt
- angefragte Subtask-IDs müssen zum aktuellen Task gehören

Das verhindert, dass ein Formular versehentlich oder absichtlich Subtasks eines anderen Tasks aktualisiert.

### Warum erst persistiert und danach gelöscht wird

Der Service arbeitet den gewünschten Zustand kontrolliert ab:

1. vorhandene Subtasks aktualisieren
2. neue Subtasks erstellen
3. nicht mehr gewünschte Subtasks löschen

Am Ende wird der tatsächliche Datenbankstand erneut geladen und in `selectedSubtasks` gesetzt.

---

## Kontaktzuweisungen dauerhaft speichern

Kontaktzuweisungen werden nicht direkt im `tasks`-Datensatz gespeichert.

Ein Task enthält also kein Feld wie `assignedContacts` oder `contactIds`. Das wäre ungünstig, weil ein Task mehrere Kontakte haben kann und ein Kontakt gleichzeitig mehreren Tasks zugewiesen werden kann.

Stattdessen werden die Zuweisungen dauerhaft über die Relationstabelle `task_assignments` gespeichert.

Die Tabelle bildet nur die Verbindung ab:

```text
task_id
contact_id
created_at
```

Dadurch entsteht eine klassische Many-to-Many-Beziehung:

```text
Ein Task → mehrere Kontakte
Ein Kontakt → mehrere Tasks
```

Die eigentlichen Kontaktdaten bleiben weiterhin in der Tabelle `contacts`.  
Der Task bleibt weiterhin in der Tabelle `tasks`.  
Die Verbindung zwischen beiden liegt in `task_assignments`.

---

### Warum nicht direkt im Task speichern?

Eine Speicherung direkt im Task, zum Beispiel als Array mit Kontakt-IDs, wäre für diesen Fall schlechter wartbar.

Nachteile eines Arrays im Task:

- Kontaktzuweisungen wären schwerer gezielt zu ändern.
- Einzelne Zuweisungen könnten nicht sauber gelöscht werden.
- Doppelte Zuweisungen müssten manuell verhindert werden.
- Die Datenbank könnte Beziehungen schlechter absichern.
- Kontakte und Tasks wären stärker miteinander vermischt.

Die Relationstabelle hält die Verantwortung klar getrennt:

```text
tasks
→ speichert Task-Daten

contacts
→ speichert Kontaktdaten

task_assignments
→ speichert nur die Beziehung zwischen Task und Kontakt
```

---

### Wie eine Zuweisung gespeichert wird

Wenn ein Kontakt einem Task zugewiesen wird, erzeugt der Service keine Änderung am Task selbst.

Stattdessen wird eine neue Zeile in `task_assignments` erstellt:

```text
task_id: ID des Tasks
contact_id: ID des Kontakts
```

Im Service läuft das über:

```typescript
assignContact(taskId, contactId)
```

Diese Methode ruft im Repository die persistente Speicherung auf:

```typescript
createTaskAssignment(taskId, contactId)
```

Für mehrere Kontakte wird entsprechend verwendet:

```typescript
createTaskAssignments(taskId, contactIds)
```

Damit bleibt die Zuweisung auch nach einem Reload erhalten, weil sie in Supabase in der Relationstabelle gespeichert ist.

---

### Wie Zuweisungen beim Bearbeiten synchronisiert werden

Beim Bearbeiten eines Tasks wird nicht blind alles gelöscht und neu erstellt.

Die Methode `synchronizeTaskAssignments()` vergleicht zuerst:

```text
aktuelle Kontakt-IDs aus der Datenbank
gewünschte Kontakt-IDs aus dem Formular
```

Daraus entstehen zwei Listen:

```text
removedIds
→ diese Zuweisungen existieren noch in der Datenbank, sind aber nicht mehr gewünscht

addedIds
→ diese Zuweisungen sind neu und müssen gespeichert werden
```

Danach werden nur die notwendigen Änderungen ausgeführt:

```text
nicht mehr gewünschte Zuweisungen löschen
neue Zuweisungen erstellen
bestehende Zuweisungen unverändert lassen
```

Das verhindert unnötige Datenbankoperationen und hält die Relationstabelle sauber.

---

### Unterschied zwischen Anzeige und Speicherung

Für die Anzeige im Board oder Detaildialog braucht die UI vollständige Kontaktdaten wie Name, E-Mail und Badge-Farbe.

Gespeichert wird aber nur die Beziehung:

```text
task_id + contact_id
```

Wenn die UI die zugewiesenen Kontakte anzeigen möchte, lädt das Repository über diese Beziehung die passenden Kontakte aus der `contacts`-Tabelle.

Deshalb gibt es zwei unterschiedliche Datenformen:

```text
TaskAssignmentRow
→ beschreibt die gespeicherte Beziehung in der Datenbank

Contact
→ beschreibt den fertigen Kontakt für die Anzeige in der UI
```

Das Board kann dadurch mit fertigen Kontaktdaten arbeiten, ohne selbst wissen zu müssen, wie die Relation in Supabase aufgebaut ist.

---

## Utils

Die ausgelagerten Utils enthalten reine Berechnungen. Sie kennen weder Angular Signals noch Supabase.

### `task-state.utils.ts`

Enthält:

- `sortTasks()`
- `sortSubtasks()`
- `replaceTask()`
- `replaceSubtask()`
- `getUniqueIds()`
- `getMissingIds()`

Diese Funktionen sind ausgelagert, weil sie keine Service-Abhängigkeiten brauchen und mehrfach nutzbar sind.

### `task-filter.utils.ts`

Enthält die Suche und Statusfilterung.

Die Filterlogik bleibt damit unabhängig vom Service und kann später leichter getestet oder direkt in Komponenten verwendet werden.

### `subtask-progress.utils.ts`

Berechnet den Fortschritt einer Subtask-Liste:

```text
completed
total
percentage
```

Diese Berechnung gehört nicht in den Service, weil sie keine Daten lädt und keinen State verändert.

---

## Fehlerbehandlung

Jede öffentliche Service-Methode setzt vor dem Start:

```typescript
isLoading.set(true)
errorMessage.set('')
```

Bei Fehlern setzt der Service eine passende Fehlermeldung und wirft den Fehler weiter.

Ablauf:

```text
Repository wirft Supabase-Fehler
  ↓
TaskService setzt errorMessage
  ↓
TaskService wirft den Fehler weiter
  ↓
Component entscheidet über UI-Feedback
```

Dadurch bleibt die technische Fehlerquelle nachvollziehbar, während die Komponente selbst über Anzeige und Benutzerfeedback entscheidet.

---

## Wiederherstellung nach fehlgeschlagenem Update

Bei `updateTaskWithRelations()` können mehrere Datenbereiche beteiligt sein:

```text
Task
Subtasks
Assignments
```

Wenn ein Schritt fehlschlägt, kann der lokale State kurzzeitig nicht mehr zum Datenbankstand passen.

Deshalb ruft der Service bei Fehlern `refreshTaskStateAfterFailure()` auf.

Diese Methode versucht:

- den Task erneut aus Supabase zu laden
- den Task im lokalen State zu ersetzen
- bei ausgewähltem Task auch Subtasks und Kontakte neu zu laden

Schlägt diese Wiederherstellung ebenfalls fehl, wird sie still beendet. Der ursprüngliche Fehler bleibt entscheidend.

---

## Öffentliche Methoden

### Laden

| Methode | Aufgabe |
|---|---|
| `getTasks()` | lädt alle Tasks und setzt `allTasks` |
| `getTaskById(id)` | lädt einen einzelnen Task und setzt `selectedTask` |
| `getSubtasksByTaskId(taskId)` | lädt Subtasks eines Tasks |
| `getAssignedContacts(taskId)` | lädt zugewiesene Kontakte eines Tasks |
| `loadAllBoardData()` | lädt alle Subtasks und Assignment-Rows für das Board |

### Tasks

| Methode | Aufgabe |
|---|---|
| `createTask(task)` | erstellt nur den Task |
| `createTaskWithRelations(input)` | erstellt Task, Subtasks und Assignments |
| `updateTask(id, task)` | aktualisiert nur Task-Daten |
| `updateTaskWithRelations(id, input)` | aktualisiert Task und optionale Relationen |
| `deleteTask(id)` | löscht einen Task und aktualisiert den State |

### Subtasks

| Methode | Aufgabe |
|---|---|
| `createSubtask(subtask)` | erstellt einen einzelnen Subtask |
| `updateSubtask(id, subtask)` | aktualisiert einen einzelnen Subtask |
| `toggleSubtaskCompletion(id, isCompleted)` | setzt den Erledigt-Status |
| `deleteSubtask(id)` | löscht einen einzelnen Subtask |
| `replaceTaskSubtasks(taskId, subtasks)` | synchronisiert die komplette Subtask-Liste eines Tasks |

### Kontaktzuweisungen

| Methode | Aufgabe |
|---|---|
| `assignContact(taskId, contactId)` | weist einen Kontakt über `task_assignments` zu |
| `removeContactAssignment(taskId, contactId)` | entfernt eine Zuweisung aus `task_assignments` |
| `replaceTaskAssignments(taskId, contactIds)` | synchronisiert alle Kontaktzuweisungen eines Tasks |

---

## Interne Helper

Die privaten Methoden sind ausgelagert, damit öffentliche Methoden lesbar bleiben.

| Methode | Grund |
|---|---|
| `refreshTaskSubtasks()` | lädt Subtasks und aktualisiert bei Bedarf `selectedSubtasks` |
| `refreshAssignedContacts()` | lädt Kontakte und aktualisiert bei Bedarf `assignedContacts` |
| `createSubtasksForTask()` | erstellt mehrere Subtasks für einen neuen Task |
| `createRelatedSubtask()` | erstellt einen Subtask mit vorhandener Task-ID |
| `synchronizeTaskSubtasks()` | gleicht Subtasks vollständig mit dem gewünschten Zustand ab |
| `persistTaskSubtasks()` | verarbeitet mehrere Subtasks nacheinander |
| `persistTaskSubtask()` | entscheidet zwischen Create und Update |
| `updateRelatedSubtask()` | aktualisiert einen Subtask nur innerhalb seines Tasks |
| `validateRequestedSubtaskIds()` | verhindert doppelte oder fremde Subtask-IDs |
| `synchronizeTaskAssignments()` | berechnet zu löschende und neue Kontaktzuweisungen |
| `updateOptionalTaskSubtasks()` | unterscheidet zwischen unverändert und bewusst geändert |
| `updateOptionalAssignments()` | unterscheidet zwischen unverändert und bewusst geändert |
| `rollbackCreatedTask()` | räumt nach fehlgeschlagenem Create-Flow bestmöglich auf |
| `refreshTaskStateAfterFailure()` | bringt lokalen State nach Fehlern näher an den Datenbankstand |
| `applyCreatedTaskState()` | setzt State nach erfolgreichem Create-Flow |
| `applyUpdatedTaskState()` | setzt State nach erfolgreichem Update-Flow |
| `addTaskToState()` | fügt Task sortiert in `allTasks` ein |
| `updateTaskInState()` | ersetzt Task in `allTasks` und ggf. `selectedTask` |
| `removeTaskFromState()` | entfernt Task und leert bei Bedarf die Auswahl |
| `clearSelectedTaskState()` | leert Task, Subtasks und Kontakte |
| `addSubtaskToState()` | ergänzt einen Subtask beim ausgewählten Task |
| `updateSubtaskInState()` | ersetzt einen Subtask im ausgewählten State |
| `removeSubtaskFromState()` | entfernt einen Subtask aus dem ausgewählten State |
| `prepareLoadingState()` | setzt Ladezustand und leert alte Fehler |
| `handleRequestError()` | setzt eine für Komponenten nutzbare Fehlermeldung |

---

## Warum Komponenten nicht direkt Supabase nutzen

Komponenten sollen sich auf Darstellung und Interaktion konzentrieren.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

Das verhindert, dass Datenbankfeldnamen, Payload-Strukturen und Relationslogik in Templates oder Komponenten verteilt werden.

Dadurch bleibt die Verantwortlichkeit klar:

```text
Component
→ Benutzerinteraktion und UI-State

TaskService
→ Geschäftsablauf und lokaler State

TaskRepository
→ Supabase-Zugriff

Mapper
→ Umwandlung zwischen Datenbank und App

Utils
→ reine Berechnungen
```

---

## Beispiel: Board lädt Daten

Ein typischer Board-Load besteht aus zwei Teilen:

```text
getTasks()
loadAllBoardData()
```

`getTasks()` lädt die eigentlichen Karten.  
`loadAllBoardData()` lädt zusätzliche Relationsdaten für Subtasks und Assignments.

Danach kann das Board:

- Tasks nach Status in Spalten anzeigen
- Subtasks pro Task zuordnen
- Assignment-Daten pro Task auswerten
- Fortschritt pro Karte berechnen
- Suche und Filter anwenden

Die Datenbankstruktur bleibt dabei außerhalb der Board-Komponente.

---

## Beispiel: Task mit Relationen erstellen

```text
Add-Task-Formular
  ↓
CreateTaskWithRelationsInput
  ↓
TaskService.createTaskWithRelations()
  ↓
TaskRepository.createTask()
  ↓
TaskRepository.createSubtask()
  ↓
TaskRepository.createTaskAssignments()
  ↓
TaskService aktualisiert Signals
  ↓
Board zeigt neuen Task
```

Die Komponente übergibt nur den gewünschten Zustand. Sie muss nicht wissen, welche Tabellen in welcher Reihenfolge beschrieben werden.

---

## Beispiel: Task mit Relationen bearbeiten

```text
Edit-Task-Formular
  ↓
UpdateTaskWithRelationsInput
  ↓
Task aktualisieren
  ↓
Subtasks optional synchronisieren
  ↓
Assignments optional synchronisieren
  ↓
lokalen State aktualisieren
```

Wichtig ist:

```text
undefined bedeutet: nicht anfassen
[] bedeutet: bewusst leeren
```

Das macht den Update-Flow eindeutig und verhindert unbeabsichtigtes Löschen von Relationen.

---

## Zusammenfassung

Der `TaskService` ist die Übersetzungsschicht zwischen UI und Datenbanklogik.

Er lädt keine fertigen UI-Objekte aus Supabase, sondern arbeitet bewusst mit Rows, Mappern und Relationsdaten. Dadurch bleiben Datenbankstruktur und Komponenten voneinander getrennt.

Die Kontaktzuweisung wird dabei nicht direkt im Task gespeichert, sondern dauerhaft über `task_assignments` als Beziehung zwischen Task und Kontakt abgebildet.

Die Komponenten bekommen nur die Datenform, die sie für die Darstellung brauchen. Die Details zu Tabellen, Foreign Keys, Payloads, Sortierung, Synchronisierung und Cleanup bleiben im Core-Bereich.