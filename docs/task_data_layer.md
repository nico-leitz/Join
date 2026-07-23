# Task-Datenebene

Dieses Dokument beschreibt die ausgelagerten Bausteine der Task-Datenebene. Ziel ist, klar zu trennen, welche Datei welche Verantwortung hat und warum diese Logik nicht direkt in Komponenten oder vollständig im `TaskService` liegt.

Die Task-Datenebene besteht aus:

```text
Models
Mapper
Payload-Mapper
Repository
Service
Utils
Supabase-Konfiguration
```

Der `TaskService` koordiniert die Abläufe. Die eigentliche Datenbankkommunikation, Umwandlung von Daten und reine Berechnungen sind bewusst ausgelagert.

---

## Ziel der Datenebene

Die Datenebene soll verhindern, dass Komponenten direkt mit Supabase, Datenbankspalten oder Relationstabellen arbeiten müssen.

Komponenten sollen nur wissen:

```text
Ich brauche Tasks.
Ich erstelle einen Task.
Ich ändere einen Task.
Ich weise Kontakte zu.
Ich zeige Subtasks an.
```

Sie sollen nicht wissen müssen:

```text
Welche Tabelle wird abgefragt?
Welche Felder heißen in der Datenbank snake_case?
Welche Payload-Struktur erwartet Supabase?
Wie werden Subtasks und Assignments synchronisiert?
Wie werden doppelte IDs entfernt?
```

Diese Aufgaben liegen im Core-Bereich.

---

## Verzeichnisstruktur

Die Task-Datenebene liegt unter:

```text
src/app/core/
├── mappers/
│   ├── task.mapper.ts
│   └── task-payload.mapper.ts
├── models/
│   ├── contact.model.ts
│   ├── subtask.model.ts
│   ├── task-assignment.model.ts
│   ├── task-persistence.model.ts
│   └── task.model.ts
├── repositories/
│   └── task.repository.ts
├── services/
│   └── task.service.ts
├── supabase/
│   ├── supabase.config.ts
│   └── supabase.ts
└── utils/
    ├── subtask-progress.utils.ts
    ├── task-filter.utils.ts
    └── task-state.utils.ts
```

---

## Schichtenübersicht

Der Datenfluss ist bewusst geschichtet:

```text
Component
  ↓
TaskService
  ↓
TaskRepository
  ↓
Supabase
```

Die Rückrichtung läuft über Mapper:

```text
Supabase Row
  ↓
Mapper
  ↓
Application Model
  ↓
TaskService
  ↓
Component
```

Beim Schreiben läuft die Umwandlung andersherum:

```text
Component Input
  ↓
TaskService
  ↓
Payload Mapper
  ↓
TaskRepository
  ↓
Supabase
```

---

## Models

Models beschreiben die Form der Daten. Es gibt mehrere Model-Arten, weil Daten in der Datenbank anders aussehen als in der Angular-Anwendung.

---

## Row-Models

Row-Models spiegeln die Datenbankstruktur wider.

Sie verwenden `snake_case`, weil Supabase die Felder genau so aus der Datenbank liefert.

Beispiel aus `task.model.ts`:

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

Diese Models werden vor allem genutzt in:

```text
TaskRepository
task.mapper.ts
task-payload.mapper.ts
```

Sie sind nicht für Komponenten gedacht.

---

## Application-Models

Application-Models sind die Datenform für Angular.

Sie verwenden `camelCase`, weil das im TypeScript-Code besser lesbar und projektweit konsistenter ist.

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

Komponenten arbeiten mit diesen Models.

Dadurch muss eine Komponente nicht wissen, dass das Datenbankfeld `due_date` heißt. Sie verwendet einfach `dueDate`.

---

## Create- und Update-Models

Create- und Update-Models beschreiben, welche Daten beim Erstellen oder Aktualisieren erlaubt sind.

### `CreateTask`

```typescript
export interface CreateTask {
  title: string;
  description?: string;
  dueDate: string;
  priority?: TaskPriority;
  category: TaskCategory;
  status?: TaskStatus;
  sortOrder?: number;
}
```

Dieses Model enthält die Daten, die ein Formular beim Erstellen eines Tasks übergeben kann.

### `UpdateTask`

```typescript
export interface UpdateTask {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  status?: TaskStatus;
  sortOrder?: number;
}
```

Beim Update sind alle Felder optional. Dadurch kann gezielt nur ein einzelner Teil geändert werden, zum Beispiel nur der Status nach Drag-and-drop.

---

## Subtask-Models

Subtasks haben ebenfalls getrennte Row- und Application-Models.

Die Datenbankform:

```typescript
export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

Die Angular-Form:

```typescript
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

Auch hier gilt:

```text
task_id      → taskId
is_completed → isCompleted
sort_order   → sortOrder
created_at   → createdAt
updated_at   → updatedAt
```

---

## Assignment-Models

Kontaktzuweisungen werden nicht im Task selbst gespeichert, sondern über `task_assignments`.

Das Row-Model beschreibt die Datenbankzeile:

```typescript
export interface TaskAssignmentRow {
  task_id: string;
  contact_id: string;
  created_at: string;
}
```

Diese Tabelle speichert nur die Verbindung zwischen Task und Kontakt.

```text
task_id
contact_id
created_at
```

Die eigentlichen Task-Daten bleiben in `tasks`.  
Die eigentlichen Kontaktdaten bleiben in `contacts`.

Dadurch entsteht eine Many-to-Many-Beziehung:

```text
Ein Task kann mehrere Kontakte haben.
Ein Kontakt kann mehreren Tasks zugewiesen sein.
```

---

## Persistence-Models

Persistence-Models beschreiben kombinierte Schreibvorgänge.

Sie liegen in:

```text
task-persistence.model.ts
```

Wichtig sind:

```typescript
CreateTaskWithRelationsInput
UpdateTaskWithRelationsInput
CreateTaskSubtaskInput
UpdateTaskSubtaskInput
```

Diese Models werden verwendet, wenn ein Task zusammen mit Subtasks und Kontaktzuweisungen erstellt oder bearbeitet wird.

Beispiel:

```typescript
export interface CreateTaskWithRelationsInput {
  task: CreateTask;
  subtasks?: CreateTaskSubtaskInput[];
  contactIds?: string[];
}
```

Die Struktur macht klar:

```text
task
→ eigentliche Task-Daten

subtasks
→ optionale Subtask-Daten

contactIds
→ optionale Kontaktzuweisungen
```

Die Komponente übergibt damit einen gewünschten Zustand. Der Service entscheidet danach, welche Datenbankoperationen notwendig sind.

---

## Mapper

Mapper übersetzen Datenbankdaten in Anwendungsdaten.

Sie liegen unter:

```text
src/app/core/mappers/
```

---

## `task.mapper.ts`

Der `task.mapper.ts` wandelt Supabase-Rows in Angular-Models um.

Richtung:

```text
Supabase → Angular
```

Beispiele:

```text
TaskRow → Task
SubtaskRow → Subtask
ContactRow → Contact
```

Typische Feldumwandlungen:

```text
due_date     → dueDate
sort_order   → sortOrder
created_at   → createdAt
updated_at   → updatedAt
task_id      → taskId
is_completed → isCompleted
first_name   → firstName
last_name    → lastName
badge_color  → badgeColor
```

Diese Umwandlung ist ausgelagert, damit weder Service noch Komponenten überall manuell Datenbankfelder übersetzen müssen.

---

## Kontakt-Relationen mappen

Für zugewiesene Kontakte liefert Supabase bei einem Join keine direkte `ContactRow[]`, sondern Relationsdaten.

Der Mapper nutzt dafür:

```typescript
TaskContactRelationRow
mapContactRelations()
```

Die Funktion liest aus jeder Relation den eingebetteten Kontakt, entfernt leere Einträge und mappt die Kontakte in das Angular-Model `Contact`.

Das ist wichtig, weil die UI am Ende keine Relation anzeigen möchte, sondern fertige Kontaktdaten:

```text
Name
E-Mail
Telefon
Badge-Farbe
Initialen
```

---

## `task-payload.mapper.ts`

Der `task-payload.mapper.ts` wandelt Angular-Daten in Supabase-Payloads um.

Richtung:

```text
Angular → Supabase
```

Beispiele:

```text
CreateTask → Partial<TaskRow>
UpdateTask → Partial<TaskRow>
CreateSubtask → Partial<SubtaskRow>
UpdateSubtask → Partial<SubtaskRow>
contactIds → TaskAssignmentRow[]
```

Diese Datei ist wichtig, weil Supabase beim Schreiben wieder Datenbankfeldnamen erwartet.

Beispiel:

```text
dueDate   → due_date
sortOrder → sort_order
taskId    → task_id
```

---

## Warum Payload-Mapping ausgelagert ist

Payloads direkt im Service zu bauen, würde den Service unnötig groß machen.

Ohne Auslagerung müsste der Service an vielen Stellen wissen:

```text
Welche Felder müssen getrimmt werden?
Welche optionalen Felder dürfen nur gesetzt werden, wenn sie vorhanden sind?
Wie heißt das Datenbankfeld?
Wann wird updated_at gesetzt?
Wie sieht eine Assignment-Zeile aus?
```

Der Payload-Mapper übernimmt genau diese Aufgabe.

Dadurch bleibt der Service auf den Ablauf fokussiert:

```text
Task erstellen
Subtasks erstellen
Assignments erstellen
State aktualisieren
Fehler behandeln
```

Die konkrete Datenbankform liegt im Mapper.

---

## Trimmen und optionale Felder

Beim Schreiben werden Texte vor dem Speichern getrimmt.

Beispiele:

```text
title.trim()
description.trim()
```

Optionale Felder werden nur dann in den Payload geschrieben, wenn sie wirklich übergeben wurden.

Das ist besonders bei Updates wichtig.

Beispiel:

```text
priority: undefined
→ wird nicht gesendet

priority: 'urgent'
→ wird gesendet
```

Dadurch werden bestehende Daten nicht versehentlich mit `undefined` überschrieben.

---

## `updated_at`

Bei Updates setzt der Payload-Mapper `updated_at`.

Das betrifft:

```text
Task-Updates
Subtask-Updates
```

So ist in der Datenbank nachvollziehbar, wann ein Datensatz zuletzt geändert wurde.

---

## Repository

Das `TaskRepository` liegt unter:

```text
src/app/core/repositories/task.repository.ts
```

Es ist die einzige Schicht der Task-Datenebene, die direkt mit dem Supabase Client arbeitet.

Das Repository kennt die Tabellennamen:

```typescript
private readonly taskTableName = 'tasks';
private readonly subtaskTableName = 'subtasks';
private readonly assignmentTableName = 'task_assignments';
```

---

## Aufgabe des Repository

Das Repository führt direkte Datenbankoperationen aus:

```text
select
insert
update
delete
```

Es filtert über:

```text
id
task_id
contact_id
```

Es sortiert Datenbankabfragen nach:

```text
sort_order
created_at
task_id
```

Und es gibt die Ergebnisse an den Service zurück.

---

## Was das Repository nicht macht

Das Repository enthält keine UI-Logik.

Es enthält auch keinen Board-State, keine Signals und keine Formularlogik.

Nicht Aufgabe des Repository:

```text
Dialog öffnen
Ladeanzeige setzen
Fehlermeldung für User anzeigen
Board-Spalten berechnen
Drag-and-drop auswerten
Formulare validieren
```

Diese Trennung ist wichtig, weil das Repository nur Datenzugriff kapseln soll.

---

## Task-Operationen im Repository

Für Tasks stellt das Repository diese grundlegenden Operationen bereit:

```text
getTaskRows()
getTaskRowById(id)
createTask(task)
updateTask(id, task)
deleteTask(id)
```

`getTaskRows()` lädt alle Tasks sortiert nach `sort_order` und `created_at`.

Diese Sortierung stellt sicher, dass Tasks beim Laden eine nachvollziehbare Reihenfolge haben.

---

## Subtask-Operationen im Repository

Für Subtasks gibt es Methoden für einzelne Tasks und für das gesamte Board.

```text
getSubtaskRows(taskId)
getAllSubtaskRows()
createSubtask(subtask)
updateSubtask(id, subtask)
updateTaskSubtask(taskId, id, subtask)
deleteSubtask(id)
deleteTaskSubtasks(taskId, subtaskIds)
```

`getSubtaskRows(taskId)` lädt nur die Subtasks eines bestimmten Tasks.

`getAllSubtaskRows()` lädt alle Subtasks für das Board. Das ist sinnvoll, wenn das Board mehrere Karten gleichzeitig darstellen muss.

Dadurch muss nicht für jeden Task einzeln eine Subtask-Abfrage ausgeführt werden.

---

## Warum `updateTaskSubtask()` zusätzlich `taskId` nutzt

`updateTaskSubtask(taskId, id, subtask)` filtert nicht nur über die Subtask-ID, sondern zusätzlich über `task_id`.

Das schützt den Update-Vorgang.

Ein Subtask wird nur geändert, wenn:

```text
die Subtask-ID stimmt
und
die Subtask wirklich zu diesem Task gehört
```

Dadurch kann ein Formular nicht versehentlich einen Subtask eines anderen Tasks aktualisieren.

---

## Assignment-Operationen im Repository

Kontaktzuweisungen werden über `task_assignments` verwaltet.

Das Repository stellt dafür bereit:

```text
getAssignedContacts(taskId)
getAssignedContactIds(taskId)
getAllAssignmentRows()
createTaskAssignment(taskId, contactId)
createTaskAssignments(taskId, contactIds)
deleteTaskAssignment(taskId, contactId)
deleteTaskAssignments(taskId, contactIds)
```

---

## Unterschied zwischen Contact-IDs und Contact-Daten

Für die Synchronisierung reichen Kontakt-IDs.

Beispiel:

```text
contact_id
```

Für die Anzeige benötigt die UI aber vollständige Kontaktdaten.

Beispiel:

```text
firstName
lastName
email
badgeColor
```

Deshalb gibt es zwei unterschiedliche Ladearten:

```text
getAssignedContactIds(taskId)
→ wird für Vergleiche und Synchronisierung verwendet

getAssignedContacts(taskId)
→ wird für die Anzeige verwendet
```

---

## Warum `getAllAssignmentRows()` Rows zurückgibt

Für das Board reicht es oft zu wissen, welche Kontakte welchem Task zugeordnet sind.

Dafür werden Assignment-Rows geladen:

```text
task_id
contact_id
created_at
```

Diese Rows können nach `task_id` gruppiert werden.

Das Board kann dadurch mehrere Tasks gleichzeitig mit ihren Relationsdaten verbinden, ohne für jede Karte einzeln eine Anfrage an Supabase zu senden.

---

## Supabase-Konfiguration

Die Supabase-Konfiguration liegt in:

```text
src/app/core/supabase/
├── supabase.config.ts
└── supabase.ts
```

---

## `supabase.config.ts`

Die Datei liest die Werte aus den Angular-Environment-Dateien:

```typescript
export const supabaseConfig = {
  url: environment.supabaseUrl,
  anonKey: environment.supabaseAnonKey,
} as const;
```

Dadurch sind URL und Key nicht hart im Service oder Repository eingetragen.

---

## `supabase.ts`

Der `SupabaseService` erstellt den Supabase Client:

```typescript
export class SupabaseService {
  public client: SupabaseClient = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
}
```

Andere Core-Dateien können diesen Client injizieren.

Komponenten sollen ihn aber nicht direkt verwenden.

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

---

## Utilities

Utilities liegen unter:

```text
src/app/core/utils/
```

Sie enthalten reine Funktionen.

Reine Funktionen bedeuten:

```text
keine Supabase-Abfragen
keine Signals
keine DOM-Zugriffe
keine Seiteneffekte
```

Sie bekommen Daten hinein und geben ein Ergebnis zurück.

---

## `task-state.utils.ts`

Diese Datei enthält Hilfsfunktionen für Sortierung, Ersetzen und ID-Vergleiche.

Enthalten sind:

```text
sortTasks()
sortSubtasks()
replaceTask()
replaceSubtask()
getUniqueIds()
getMissingIds()
```

---

## Sortierung

`sortTasks()` sortiert Tasks nach:

```text
sortOrder
createdAt
```

`sortSubtasks()` sortiert Subtasks nach:

```text
sortOrder
createdAt
```

Dadurch bleibt die Reihenfolge stabil, auch wenn mehrere Einträge denselben `sortOrder` besitzen.

---

## Ersetzen im State

`replaceTask()` ersetzt einen Task anhand seiner ID im bestehenden Array.

`replaceSubtask()` macht dasselbe für Subtasks.

Der Service nutzt diese Funktionen, damit nach einem Update nicht der komplette State manuell neu aufgebaut werden muss.

---

## ID-Vergleiche

`getUniqueIds()` entfernt doppelte IDs.

Das ist wichtig bei Kontaktzuweisungen, weil ein Kontakt nicht mehrfach demselben Task zugeordnet werden soll.

`getMissingIds()` vergleicht zwei ID-Listen.

Es wird genutzt, um herauszufinden:

```text
Welche IDs müssen gelöscht werden?
Welche IDs müssen neu erstellt werden?
Welche IDs sind ungültig?
```

Diese Logik wird vor allem bei der Synchronisierung von Subtasks und Kontaktzuweisungen verwendet.

---

## `task-filter.utils.ts`

Diese Datei enthält die Filterlogik für Tasks.

Enthalten sind:

```text
filterTasks()
filterTasksBySearchTerm()
filterTasksByStatus()
```

Die Suche prüft:

```text
title
description
```

Der Suchbegriff wird vorher normalisiert:

```text
trim()
toLowerCase()
```

Dadurch ist die Suche unabhängig von Groß- und Kleinschreibung.

---

## Warum Filterlogik ausgelagert ist

Die Filterlogik ist keine Datenbanklogik und keine UI-Darstellung.

Sie ist eine reine Berechnung auf einem vorhandenen Task-Array.

Deshalb liegt sie in einer Utility-Datei.

Vorteile:

```text
leichter testbar
unabhängig von Angular
unabhängig von Supabase
wiederverwendbar für Board oder spätere Ansichten
```

---

## `subtask-progress.utils.ts`

Diese Datei berechnet den Fortschritt einer Subtask-Liste.

Rückgabewert:

```typescript
export interface SubtaskProgress {
  completed: number;
  total: number;
  percentage: number;
}
```

Berechnet wird:

```text
completed
total
percentage
```

Wenn ein Task keine Subtasks besitzt, wird `percentage` auf `0` gesetzt.

Dadurch entstehen keine Divisionen durch `0`.

---

## Warum Fortschritt nicht im Service berechnet wird

Die Fortschrittsberechnung lädt keine Daten und verändert keinen State.

Sie berechnet nur aus einer vorhandenen Subtask-Liste einen Wert für die Anzeige.

Deshalb gehört sie nicht in den Service, sondern in eine Utility.

---

## Warum diese Auslagerungen sinnvoll sind

Die Datenebene ist auf mehrere Dateien aufgeteilt, weil jede Datei eine klare Aufgabe hat.

```text
Models
→ beschreiben Datenformen

Mapper
→ wandeln Supabase-Daten in Angular-Daten um

Payload-Mapper
→ wandeln Angular-Daten in Supabase-Payloads um

Repository
→ führt Supabase-Abfragen aus

TaskService
→ koordiniert Geschäftsabläufe und State

Utils
→ enthalten reine Berechnungen
```

Dadurch bleibt jede Datei kleiner und verständlicher.

Der `TaskService` muss nicht selbst wissen, wie jede Datenbank-Payload im Detail aussieht.  
Das Repository muss nicht wissen, wie das Board seinen State hält.  
Die Komponenten müssen nicht wissen, wie viele Tabellen beteiligt sind.

---

## Beispiel: Task laden

```text
Component
  ↓
TaskService.getTasks()
  ↓
TaskRepository.getTaskRows()
  ↓
Supabase tasks
  ↓
TaskRow[]
  ↓
mapTaskRows()
  ↓
Task[]
  ↓
allTasks Signal
```

Die Komponente erhält `Task[]` und keine `TaskRow[]`.

---

## Beispiel: Task speichern

```text
Component
  ↓
CreateTask
  ↓
TaskService.createTask()
  ↓
TaskRepository.createTask()
  ↓
createTaskInsertPayload()
  ↓
Supabase insert in tasks
  ↓
TaskRow
  ↓
mapTaskRow()
  ↓
Task
```

Der Payload-Mapper sorgt dafür, dass `dueDate` wieder zu `due_date` wird.

---

## Beispiel: Kontaktzuweisung speichern

```text
Component
  ↓
contactIds
  ↓
TaskService
  ↓
TaskRepository.createTaskAssignments()
  ↓
createTaskAssignmentRows()
  ↓
Supabase insert in task_assignments
```

Gespeichert wird nicht der komplette Kontakt im Task.

Gespeichert wird nur die Beziehung:

```text
task_id + contact_id
```

Die Kontaktdaten werden später über diese Beziehung aus `contacts` geladen.

---

## Beispiel: Board-Daten laden

Für das Board werden mehrere Datenarten benötigt:

```text
Tasks
Subtasks
Assignments
```

Die Daten werden bewusst getrennt geladen:

```text
getTasks()
loadAllBoardData()
```

Dadurch kann das Board Tasks, Subtasks und Zuweisungen nach `taskId` zusammenführen.

Das vermeidet viele einzelne Requests pro Task und hält die Datenstruktur nachvollziehbar.

---

## Fehlerbehandlung in der Datenebene

Supabase-Fehler werden im Repository geprüft.

Wenn Supabase einen Fehler zurückgibt, wirft das Repository diesen Fehler weiter.

Der Service kann danach:

```text
errorMessage setzen
State aktualisieren oder zurücksetzen
Fehler an die Komponente weiterwerfen
```

Die Komponente entscheidet anschließend, wie der Fehler für den User dargestellt wird.

---

## Testbare Bereiche

Besonders gut testbar sind die ausgelagerten reinen Funktionen.

Dazu gehören:

```text
task-state.utils.ts
task-filter.utils.ts
subtask-progress.utils.ts
task.mapper.ts
task-payload.mapper.ts
```

Sinnvolle Tests:

```text
Rows werden korrekt zu Application-Models gemappt.
Payloads verwenden die richtigen Datenbankfelder.
Optionale Felder werden korrekt ausgelassen.
Tasks werden nach sortOrder sortiert.
Subtasks werden nach sortOrder sortiert.
Doppelte IDs werden entfernt.
Fehlende IDs werden korrekt erkannt.
Suchbegriffe filtern Titel und Beschreibung.
Subtask-Fortschritt wird korrekt berechnet.
```

---

## Abgrenzung zu anderen Dokumenten

Diese Datei beschreibt die Bausteine der Datenebene.

Für den kompletten Ablauf im `TaskService` siehe:

```text
docs/task-service.md
```

Für die spätere Verwendung in Komponenten siehe:

```text
docs/task-service-integration.md
```

Für Tabellen, Constraints und Testdaten siehe:

```text
docs/supabase-database.md
```

---

## Zusammenfassung

Die Task-Datenebene trennt Speicherung, Umwandlung, Geschäftslogik und Berechnung voneinander.

Das Repository spricht mit Supabase.  
Mapper übersetzen zwischen Datenbank und Angular.  
Payload-Mapper bauen sichere Schreibdaten.  
Utils enthalten reine Berechnungen.  
Der `TaskService` koordiniert daraus die eigentlichen Abläufe.

Dadurch bleiben Komponenten frei von Datenbankdetails und die Task-Logik bleibt nachvollziehbar wartbar.