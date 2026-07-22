# Projektarchitektur

Dieses Dokument beschreibt die technische Struktur des Join-Projekts, die Zuständigkeiten der einzelnen Schichten und den vorgesehenen Datenfluss.

---

## Ziele der Architektur

Die Architektur soll:

- direkte Datenbankzugriffe aus Komponenten verhindern
- UI-, Geschäfts- und Datenzugriffslogik trennen
- wiederverwendbare Funktionen zentral bereitstellen
- Fehler leichter lokalisierbar machen
- paralleles Arbeiten im Team erleichtern
- nachvollziehbare Schnittstellen schaffen
- Supabase-spezifische Feldnamen von Angular-Komponenten fernhalten

---

## Verzeichnisstruktur

```text
src/app/
├── core/
│   ├── mappers/
│   │   ├── task.mapper.ts
│   │   └── task-payload.mapper.ts
│   ├── models/
│   │   ├── contact.model.ts
│   │   ├── subtask.model.ts
│   │   ├── task-assignment.model.ts
│   │   ├── task-persistence.model.ts
│   │   └── task.model.ts
│   ├── repositories/
│   │   └── task.repository.ts
│   ├── services/
│   │   ├── contact.service.ts
│   │   └── task.service.ts
│   ├── supabase/
│   │   ├── supabase.config.ts
│   │   └── supabase.ts
│   └── utils/
│       ├── subtask-progress.utils.ts
│       ├── task-filter.utils.ts
│       └── task-state.utils.ts
├── features/
│   ├── auth/
│   ├── board/
│   ├── contacts/
│   ├── summary/
│   └── tasks/
├── layout/
└── shared/
```

---

## Components

Components befinden sich überwiegend unter:

```text
src/app/features/
```

### Aufgaben einer Component

- Daten für das Template bereitstellen
- Benutzerinteraktionen behandeln
- Formulare verwalten
- Dialoge öffnen und schließen
- Drag-and-drop behandeln
- Service-Methoden aufrufen
- Lade-, Erfolgs- und Fehlerfeedback darstellen
- Daten an Child-Komponenten weitergeben
- Outputs von Child-Komponenten verarbeiten

### Eine Component darf nicht

- direkt auf Supabase zugreifen
- Datenbankspalten umwandeln
- SQL-nahe Payloads erzeugen
- RLS- oder Datenbanklogik enthalten
- Repository-Methoden direkt verwenden

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

---

## Services

Services befinden sich unter:

```text
src/app/core/services/
```

Der `TaskService` ist die öffentliche Schnittstelle der Task-Datenebene.

### Aufgaben des TaskService

- Geschäftsabläufe koordinieren
- mehrere Repository-Aufrufe zusammenfassen
- Relationsdaten synchronisieren
- Angular Signals verwalten
- Lade- und Fehlerstatus bereitstellen
- Anwendungsmodels an Komponenten zurückgeben
- lokalen State nach Schreiboperationen aktualisieren
- bei fehlgeschlagenen Abläufen den tatsächlichen Datenbankstand neu laden
- bei fehlgeschlagenem Create-Flow ein bestmögliches Cleanup durchführen

### Der TaskService enthält nicht

- HTML- oder DOM-Logik
- Drag-and-drop-Berechnungen
- FormControls
- Dialogzustände
- visuelles Feedback
- SCSS-Logik

---

## Repositories

Repositories befinden sich unter:

```text
src/app/core/repositories/
```

Das `TaskRepository` kapselt direkte Supabase-Zugriffe.

### Aufgaben des Repository

- `select`
- `insert`
- `update`
- `delete`
- Filter über IDs und Fremdschlüssel
- Rückgabe von Datenbankzeilen
- Weiterreichen von Supabase-Fehlern

### Das Repository enthält nicht

- Component Signals
- UI-Logik
- Board-State
- Dialoglogik
- Formularvalidierung
- Benutzermeldungen

---

## Models

Models befinden sich unter:

```text
src/app/core/models/
```

Es gibt bewusst mehrere Modellarten.

### Row-Models

Row-Models spiegeln die Datenbankstruktur wider.

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

Row-Models verwenden `snake_case`.

### Application-Models

Application-Models werden innerhalb der Angular-Anwendung verwendet.

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

Application-Models verwenden `camelCase`.

### Create-Models

Create-Models enthalten die beim Erstellen erlaubten Daten.

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

### Update-Models

Update-Models enthalten ausschließlich optionale Felder.

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

### Persistence-Models

Persistence-Models beschreiben kombinierte Schreibvorgänge.

```text
CreateTaskWithRelationsInput
UpdateTaskWithRelationsInput
CreateTaskSubtaskInput
UpdateTaskSubtaskInput
```

Sie werden für Tasks mit Subtasks und Kontaktzuweisungen verwendet.

---

## Mapper

Mapper befinden sich unter:

```text
src/app/core/mappers/
```

### `task.mapper.ts`

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

### `task-payload.mapper.ts`

Richtung:

```text
Angular → Supabase
```

Mapper verhindern, dass Components Datenbankfeldnamen wie `due_date` oder `sort_order` kennen müssen.

---

## Utilities

Utilities befinden sich unter:

```text
src/app/core/utils/
```

Utilities sind reine Funktionen.

Sie:

- injizieren keine Angular Services
- greifen nicht auf Supabase zu
- verändern keine Signals
- haben keine Seiteneffekte

### `task-state.utils.ts`

Enthält:

- Task-Sortierung
- Subtask-Sortierung
- Ersetzen eines Tasks im State
- Ersetzen eines Subtasks im State
- Entfernen doppelter IDs
- Ermitteln fehlender IDs

### `task-filter.utils.ts`

Enthält:

- Suche über Titel und Beschreibung
- Statusfilter
- kombinierte Filterung

### `subtask-progress.utils.ts`

Enthält:

- Anzahl erledigter Subtasks
- Gesamtzahl
- Prozentwert

---

## Datenfluss beim Lesen

```text
Board Component
    ↓
TaskService.getTasks()
    ↓
TaskRepository.getTaskRows()
    ↓
Supabase SELECT
    ↓
TaskRow[]
    ↓
mapTaskRows()
    ↓
Task[]
    ↓
TaskService.allTasks
    ↓
Board Template
```

---

## Datenfluss beim Erstellen

```text
AddTask Component
    ↓
TaskService.createTaskWithRelations()
    ↓
TaskRepository.createTask()
    ↓
Supabase tasks
    ↓
Task-ID
    ↓
TaskRepository.createSubtask()
    ↓
Supabase subtasks
    ↓
TaskRepository.createTaskAssignments()
    ↓
Supabase task_assignments
    ↓
TaskService Signals
```

---

## Datenfluss beim Bearbeiten

```text
Edit Component
    ↓
TaskService.updateTaskWithRelations()
    ↓
TaskRepository.updateTask()
    ↓
Subtasks synchronisieren
    ↓
Kontaktzuweisungen synchronisieren
    ↓
Signals aktualisieren
```

---

## Drag-and-drop-Abgrenzung

Die Drag-and-drop-Logik gehört in die Board-Komponente.

Die Component ist verantwortlich für:

- Start- und Zielspalte
- Zielindex
- lokale Array-Reihenfolge
- Angular-CDK-Events
- visuelles Drag-Feedback
- Rücksetzen der Darstellung bei Fehlern
- Neuberechnung von `sortOrder`

Der Service ist nur für die Persistenz verantwortlich:

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

Werden mehrere Tasks neu indexiert, muss die Component alle betroffenen Tasks persistieren.

---

## Fehlerbehandlung

```text
Supabase Error
    ↓
TaskRepository wirft Error
    ↓
TaskService setzt errorMessage
    ↓
TaskService wirft Error weiter
    ↓
Component behandelt Fehler
```

Beispiel:

```typescript
try {
  await this.taskService.getTasks();
} catch (error) {
  console.error('Tasks could not be loaded.', error);
}
```

---

## Zuständigkeitsübersicht

| Aufgabe | Zuständige Schicht |
|---|---|
| HTML anzeigen | Component |
| FormControls verwalten | Component |
| Drag-and-drop berechnen | Component |
| Ladefeedback anzeigen | Component |
| Daten laden | TaskService |
| kombinierten Create-Flow ausführen | TaskService |
| Relationsdaten synchronisieren | TaskService |
| Supabase Query ausführen | TaskRepository |
| Datenbankfelder umwandeln | Mapper |
| Tasks filtern | Utility |
| Fortschritt berechnen | Utility |
| Daten speichern | Supabase |

---

## Grundregel für neue Features

Vor einer neuen Funktion muss geklärt werden:

1. Ist es UI- oder Interaktionslogik?  
   Dann gehört sie in die Component.

2. Koordiniert sie mehrere Datenoperationen?  
   Dann gehört sie in den Service.

3. Ist es ein direkter Supabase-Zugriff?  
   Dann gehört sie in das Repository.

4. Wandelt sie Datenstrukturen um?  
   Dann gehört sie in einen Mapper.

5. Ist es eine reine Berechnung?  
   Dann gehört sie in eine Utility.