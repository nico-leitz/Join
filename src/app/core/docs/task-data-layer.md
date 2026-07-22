# Task-Datenebene

Dieses Dokument beschreibt die vollständige Datenebene für Tasks, Subtasks und Kontaktzuweisungen.

---

## Übersicht

Die Task-Datenebene besteht aus:

```text
Models
Mapper
Payload Mapper
Repository
Service
Utilities
Supabase
```

Datenfluss:

```text
Component
    ↓
TaskService
    ↓
TaskRepository
    ↓
Supabase
```

---

## Relevante Dateien

```text
src/app/core/models/task.model.ts
src/app/core/models/subtask.model.ts
src/app/core/models/task-assignment.model.ts
src/app/core/models/task-persistence.model.ts

src/app/core/mappers/task.mapper.ts
src/app/core/mappers/task-payload.mapper.ts

src/app/core/repositories/task.repository.ts
src/app/core/services/task.service.ts

src/app/core/utils/task-state.utils.ts
src/app/core/utils/task-filter.utils.ts
src/app/core/utils/subtask-progress.utils.ts
```

---

## Task-Models

### TaskPriority

```typescript
export type TaskPriority =
  | 'urgent'
  | 'medium'
  | 'low';
```

### TaskCategory

```typescript
export type TaskCategory =
  | 'technical_task'
  | 'user_story';
```

### TaskStatus

```typescript
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'awaiting_feedback'
  | 'done';
```

### TaskRow

`TaskRow` bildet die Datenbankzeile ab.

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

Dieser Typ wird hauptsächlich verwendet von:

- Repository
- Mapper
- Payload Mapper

### Task

`Task` ist das Model für Components und Service-State.

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

### CreateTask

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

Standardwerte werden von der Datenbank ergänzt, wenn sie nicht übergeben werden:

```text
priority = medium
status = todo
sort_order = 0
description = ''
```

### UpdateTask

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

Alle Felder sind optional.

---

## Subtask-Models

### SubtaskRow

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

### Subtask

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

### CreateSubtask

```typescript
export interface CreateSubtask {
  taskId: string;
  title: string;
  sortOrder?: number;
}
```

### UpdateSubtask

```typescript
export interface UpdateSubtask {
  title?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}
```

---

## Assignment-Models

### TaskAssignmentRow

```typescript
export interface TaskAssignmentRow {
  task_id: string;
  contact_id: string;
  created_at: string;
}
```

### TaskAssignment

```typescript
export interface TaskAssignment {
  taskId: string;
  contactId: string;
  createdAt: string;
}
```

### CreateTaskAssignment

```typescript
export interface CreateTaskAssignment {
  taskId: string;
  contactId: string;
}
```

---

## Persistence-Models

### CreateTaskSubtaskInput

```typescript
export interface CreateTaskSubtaskInput {
  title: string;
  sortOrder?: number;
}
```

Eine `taskId` ist nicht erforderlich. Der Service ergänzt sie nach dem Erstellen des Tasks.

### UpdateTaskSubtaskInput

```typescript
export interface UpdateTaskSubtaskInput {
  id?: string;
  title: string;
  isCompleted?: boolean;
  sortOrder?: number;
}
```

Bedeutung:

- `id` vorhanden: bestehender Subtask
- `id` nicht vorhanden: neuer Subtask

### CreateTaskWithRelationsInput

```typescript
export interface CreateTaskWithRelationsInput {
  task: CreateTask;
  subtasks?: CreateTaskSubtaskInput[];
  contactIds?: string[];
}
```

### UpdateTaskWithRelationsInput

```typescript
export interface UpdateTaskWithRelationsInput {
  task: UpdateTask;
  subtasks?: UpdateTaskSubtaskInput[];
  contactIds?: string[];
}
```

---

## Bedeutung von `undefined` und leeren Arrays

Bei `updateTaskWithRelations()` besteht ein wichtiger Unterschied.

### `undefined`

```typescript
{
  task: {
    title: 'Updated title',
  },
}
```

Bedeutung:

```text
Subtasks nicht verändern
Kontaktzuweisungen nicht verändern
```

### Leeres Array

```typescript
{
  task: {},
  subtasks: [],
  contactIds: [],
}
```

Bedeutung:

```text
alle Subtasks entfernen
alle Kontaktzuweisungen entfernen
```

Components dürfen diese Fälle nicht gleich behandeln.

---

## Task Mapper

Datei:

```text
src/app/core/mappers/task.mapper.ts
```

### Funktionen

```typescript
mapTaskRows()
mapTaskRow()
mapSubtaskRows()
mapSubtaskRow()
mapContactRelations()
```

Beispiel:

```typescript
{
  due_date: '2026-07-30',
  sort_order: 1,
}
```

wird zu:

```typescript
{
  dueDate: '2026-07-30',
  sortOrder: 1,
}
```

---

## Payload Mapper

Datei:

```text
src/app/core/mappers/task-payload.mapper.ts
```

### Funktionen

```typescript
createTaskInsertPayload()
createTaskUpdatePayload()
createSubtaskInsertPayload()
createSubtaskUpdatePayload()
createTaskAssignmentRow()
createTaskAssignmentRows()
```

Der Payload Mapper:

- trimmt Titel
- trimmt Beschreibungen
- setzt Datenbankfeldnamen
- setzt `updated_at`
- lässt nicht gesetzte optionale Felder aus

---

## TaskRepository

Datei:

```text
src/app/core/repositories/task.repository.ts
```

Das Repository ist die einzige Task-Schicht mit direktem Supabase-Zugriff.

### Task-Operationen

```typescript
getTaskRows()
getTaskRowById()
createTask()
updateTask()
deleteTask()
```

### Subtask-Operationen

```typescript
getSubtaskRows()
createSubtask()
updateSubtask()
updateTaskSubtask()
deleteSubtask()
deleteTaskSubtasks()
```

### Assignment-Operationen

```typescript
getAssignedContacts()
getAssignedContactIds()
createTaskAssignment()
createTaskAssignments()
deleteTaskAssignment()
deleteTaskAssignments()
```

Components dürfen das Repository nicht direkt injizieren.

---

## TaskService

Datei:

```text
src/app/core/services/task.service.ts
```

Der `TaskService` ist die Schnittstelle für Components.

### Signals

```typescript
allTasks
selectedTask
selectedSubtasks
assignedContacts
isLoading
errorMessage
```

### Lesemethoden

```typescript
getTasks()
getTaskById()
getSubtasksByTaskId()
getAssignedContacts()
```

### Task-Methoden

```typescript
createTask()
createTaskWithRelations()
updateTask()
updateTaskWithRelations()
deleteTask()
```

### Subtask-Methoden

```typescript
createSubtask()
updateSubtask()
toggleSubtaskCompletion()
deleteSubtask()
replaceTaskSubtasks()
```

### Kontaktzuweisungen

```typescript
assignContact()
removeContactAssignment()
replaceTaskAssignments()
```

---

## Kombinierter Create-Flow

Methode:

```typescript
createTaskWithRelations()
```

Ablauf:

1. Task erstellen
2. erzeugte Task-ID übernehmen
3. Subtasks erstellen
4. doppelte Kontakt-IDs entfernen
5. Kontaktzuweisungen erstellen
6. Kontakte neu laden
7. Signals aktualisieren

Fehlt ein Relationsschritt, versucht der Service den neu erstellten Task wieder zu löschen.

Durch `ON DELETE CASCADE` werden bereits erstellte Relationsdaten mit entfernt.

---

## Kombinierter Update-Flow

Methode:

```typescript
updateTaskWithRelations()
```

Ablauf:

1. Task-Daten aktualisieren
2. optional Subtasks synchronisieren
3. optional Kontakte synchronisieren
4. Signals aktualisieren

Da die Supabase-JavaScript-Aufrufe mehrere Tabellen betreffen, gibt es aktuell keine gemeinsame clientseitige Datenbanktransaktion.

Bei einem Fehler:

- können bereits erfolgreiche Teilschritte gespeichert sein
- lädt der Service den tatsächlichen Datenbankstand neu
- zeigt der lokale State anschließend den gespeicherten Stand

---

## Subtask-Synchronisierung

Methode:

```typescript
replaceTaskSubtasks()
```

Der Service erkennt:

- bestehende Subtasks mit ID
- neue Subtasks ohne ID
- entfernte Subtasks
- geänderte Sortierungen
- geänderte Completion-Werte

Nicht mehr übergebene bestehende Subtasks werden gelöscht.

Zusätzliche Validierung:

- keine doppelten Subtask-IDs
- bestehende Subtask-ID muss zum Task gehören

---

## Kontakt-Synchronisierung

Methode:

```typescript
replaceTaskAssignments()
```

Der Service:

1. lädt aktuell zugewiesene Kontakt-IDs
2. entfernt doppelte angeforderte IDs
3. bestimmt entfernte IDs
4. bestimmt neue IDs
5. löscht nur entfernte Beziehungen
6. erstellt nur neue Beziehungen

Unveränderte Zuweisungen bleiben bestehen.

---

## Task-State-Utilities

Datei:

```text
src/app/core/utils/task-state.utils.ts
```

### `sortTasks()`

Sortiert nach:

1. `sortOrder`
2. `createdAt`

### `sortSubtasks()`

Sortiert nach:

1. `sortOrder`
2. `createdAt`

### `replaceTask()`

Ersetzt einen Task mit derselben ID und sortiert anschließend neu.

### `replaceSubtask()`

Ersetzt einen Subtask mit derselben ID und sortiert anschließend neu.

### `getUniqueIds()`

Entfernt doppelte IDs.

### `getMissingIds()`

Bestimmt IDs, die in einer Vergleichsliste nicht enthalten sind.

---

## Task-Filter

Datei:

```text
src/app/core/utils/task-filter.utils.ts
```

### Verfügbare Funktionen

```typescript
filterTasks()
filterTasksBySearchTerm()
filterTasksByStatus()
```

Die Suche berücksichtigt:

- Titel
- Beschreibung
- Groß- und Kleinschreibung werden ignoriert
- Leerzeichen am Anfang und Ende werden entfernt
- eine leere Suche gibt alle Tasks zurück

---

## Subtask-Fortschritt

Datei:

```text
src/app/core/utils/subtask-progress.utils.ts
```

Funktion:

```typescript
calculateSubtaskProgress()
```

Rückgabe:

```typescript
{
  completed: 2,
  total: 5,
  percentage: 40,
}
```

Ohne Subtasks:

```typescript
{
  completed: 0,
  total: 0,
  percentage: 0,
}
```

---

## Mögliche Erweiterungen

- generierte Supabase-Datenbanktypen
- serverseitige Transaktionen über PostgreSQL-Funktionen
- Task-Abfrage mit eingebetteten Subtasks und Kontakten
- paginierte Task-Abfragen
- Realtime-Subscriptions
- workspacebezogene RLS-Policies
- zentraler Validation-Layer
- Unit-Tests für Repository und Service