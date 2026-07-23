# Projektarchitektur

Dieses Dokument beschreibt die technische Grundstruktur des Join-Projekts. Es erklärt die wichtigsten Schichten, deren Zuständigkeiten und den vorgesehenen Datenfluss zwischen UI, Services und Supabase.

Detailfragen zu einzelnen Bereichen sind in eigenen Dokumenten beschrieben.

---

## Ziel der Architektur

Die Architektur soll verhindern, dass Logik ungeordnet in Components verteilt wird.

Wichtige Ziele:

- Components bleiben für Darstellung und Benutzerinteraktion zuständig.
- Services koordinieren Datenlogik und gemeinsamen State.
- Repository-Klassen kapseln direkte Supabase-Zugriffe.
- Mapper trennen Datenbankfelder von Angular-Models.
- Utils enthalten reine Berechnungen.
- Supabase-spezifische Details bleiben außerhalb der UI.
- Änderungen bleiben für das Team nachvollziehbar und reviewbar.

---

## Grundprinzip

Der Datenfluss läuft immer über klar getrennte Schichten.

```text
Component
  ↓
Service
  ↓
Repository
  ↓
Supabase
```

Beim Lesen werden Daten zurückgemappt:

```text
Supabase Row
  ↓
Mapper
  ↓
Application Model
  ↓
Service-State oder Rückgabewert
  ↓
Component
```

Beim Schreiben läuft die Umwandlung in die andere Richtung:

```text
Component Input
  ↓
Service
  ↓
Payload Mapper
  ↓
Repository
  ↓
Supabase
```

---

## Verzeichnisstruktur

Die zentrale Struktur liegt unter `src/app`.

```text
src/app/
├── core/
│   ├── mappers/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── supabase/
│   └── utils/
├── features/
│   ├── auth/
│   ├── board/
│   ├── contacts/
│   ├── summary/
│   └── tasks/
├── layout/
└── shared/
```

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

---

## Core-Bereich

Der `core`-Bereich enthält Logik, die nicht direkt zu einer einzelnen UI-Component gehört.

Dazu zählen:

```text
Models
Mapper
Payload-Mapper
Repositories
Services
Supabase-Konfiguration
Utils
```

Der Core-Bereich bildet die technische Grundlage für Features wie Kontakte, Tasks und Board.

---

## Features-Bereich

Der `features`-Bereich enthält sichtbare Funktionsbereiche der Anwendung.

Beispiele:

```text
contacts
tasks
board
summary
auth
```

Feature-Components dürfen Services verwenden, aber nicht direkt auf Supabase zugreifen.

---

## Layout-Bereich

Der `layout`-Bereich enthält Komponenten, die die Anwendung strukturieren.

Beispiele:

```text
Header
Sidebar
Mobile Navigation
```

Layout-Components enthalten normalerweise keine Feature-Datenlogik.

---

## Shared-Bereich

Der `shared`-Bereich ist für wiederverwendbare UI-Elemente oder Hilfsstrukturen vorgesehen.

Dort sollte nur Code liegen, der wirklich von mehreren Features genutzt wird.

---

## Components

Components sind für UI und Benutzerinteraktion zuständig.

Aufgaben einer Component:

- HTML und Darstellung
- Klicks und Benutzeraktionen
- Formulare und Validierung
- Dialoge öffnen und schließen
- lokale UI-Zustände
- Lade- und Fehlerfeedback anzeigen
- Daten per Input empfangen
- Aktionen per Output melden
- Service-Methoden aufrufen

Components sollen keine Datenbankdetails kennen.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

oder:

```typescript
private readonly contactService = inject(ContactService);
```

---

## Services

Services sind die öffentliche Schnittstelle für Components.

Sie koordinieren:

- Daten laden
- Daten erstellen
- Daten aktualisieren
- Daten löschen
- gemeinsamen State
- mehrere zusammenhängende Datenoperationen
- Fehler- und Ladezustände
- Mapping-Ergebnisse
- lokale State-Updates nach CRUD-Operationen

Wichtige Services:

```text
ContactService
TaskService
SupabaseService
```

Der `TaskService` ist komplexer als der `ContactService`, weil ein Task aus mehreren Tabellen und Relationen besteht.

---

## Repository-Schicht

Repositories kapseln direkte Supabase-Abfragen.

Beispiel:

```text
TaskRepository
```

Das Repository führt aus:

```text
select
insert
update
delete
```

Es kennt Tabellen, Filter und direkte Supabase-Query-Strukturen.

Das Repository enthält keine UI-Logik, keine FormControls und keinen Component-State.

---

## SupabaseService

Der `SupabaseService` erstellt den Supabase Client zentral.

Die Konfiguration kommt aus:

```text
src/app/core/supabase/supabase.config.ts
```

Die echten Environment-Werte liegen lokal in:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

In diese Dateien gehört nur der Supabase `anon public key`, niemals der `service_role` Key.

---

## Models

Models beschreiben Datenformen.

Es gibt mehrere Arten:

```text
Row-Models
Application-Models
Create-Models
Update-Models
Persistence-Models
```

### Row-Models

Row-Models spiegeln die Datenbankstruktur wider.

Sie verwenden `snake_case`.

Beispiel:

```typescript
export interface TaskRow {
  due_date: string;
  sort_order: number;
  created_at: string;
}
```

### Application-Models

Application-Models werden in Angular verwendet.

Sie verwenden `camelCase`.

Beispiel:

```typescript
export interface Task {
  dueDate: string;
  sortOrder: number;
  createdAt: string;
}
```

Components sollen mit Application-Models arbeiten, nicht mit Row-Models.

---

## Mapper

Mapper übersetzen zwischen Datenbank und Anwendung.

Leserichtung:

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

Dadurch müssen Components keine Datenbankfeldnamen kennen.

---

## Payload-Mapper

Payload-Mapper übersetzen Angular-Daten in Supabase-Payloads.

Schreibrichtung:

```text
CreateTask → Partial<TaskRow>
UpdateTask → Partial<TaskRow>
CreateSubtask → Partial<SubtaskRow>
UpdateSubtask → Partial<SubtaskRow>
contactIds → TaskAssignmentRow[]
```

Payload-Mapper sind wichtig, damit diese Logik nicht mehrfach in Services oder Components entsteht.

---

## Utils

Utils enthalten reine Funktionen.

Eine Utility:

- injiziert keine Angular Services
- ruft kein Supabase auf
- verändert keine Signals
- hat keine Seiteneffekte
- bekommt Daten hinein und gibt ein Ergebnis zurück

Beispiele:

```text
sortTasks()
sortSubtasks()
filterTasks()
calculateSubtaskProgress()
getUniqueIds()
getMissingIds()
```

---

## State Management

State wird getrennt nach fachlichem Daten-State und lokalem UI-State.

### Service-State

Service-State liegt in Services, wenn mehrere Components ihn brauchen.

Beispiele:

```text
ContactService.allContacts
ContactService.selectedContact
TaskService.allTasks
TaskService.selectedTask
TaskService.selectedSubtasks
TaskService.assignedContacts
```

### Component-State

Component-State bleibt lokal, wenn er nur die Darstellung betrifft.

Beispiele:

```text
isCreateDialogOpen
isEditDialogOpen
searchTerm
isMobileMenuOpen
successMessage
form
```

Details stehen in:

```text
docs/state-management.md
```

---

## Kontaktbereich

Der Kontaktbereich besteht aus:

```text
Contacts Page
ContactList
ContactDetail
ContactCreateDialog
ContactEditDialog
ContactSuccessOverlay
```

Der zentrale Service ist:

```text
ContactService
```

Der `ContactService` verwaltet:

```text
allContacts
selectedContact
CRUD
Mapping
Sortierung
Badge-Farben
```

Die Components kümmern sich um Anzeige, Dialoge, Formulare und Events.

Details stehen in:

```text
docs/contact-service.md
docs/contact-components.md
```

---

## Task- und Boardbereich

Der Task- und Boardbereich arbeitet mit mehreren Datenarten:

```text
Tasks
Subtasks
Kontaktzuweisungen
Kontakte
```

Beteiligte Tabellen:

```text
tasks
subtasks
task_assignments
contacts
```

Der zentrale Service ist:

```text
TaskService
```

Der `TaskService` koordiniert:

```text
Task-CRUD
Subtask-CRUD
Kontaktzuweisungen
Relationsdaten
Signal-State
Fehlerbehandlung
```

Details stehen in:

```text
docs/task-service.md
docs/task-data-layer.md
docs/task-service-integration.md
docs/task-components.md
```

---

## Kontaktzuweisungen

Kontaktzuweisungen werden nicht direkt im Task gespeichert.

Nicht vorgesehen:

```text
tasks.assignedContacts
tasks.contactIds
```

Vorgesehen:

```text
task_assignments
```

Gespeichert wird nur die Beziehung:

```text
task_id + contact_id
```

Die eigentlichen Task-Daten bleiben in `tasks`.  
Die eigentlichen Kontaktdaten bleiben in `contacts`.

Details stehen in:

```text
docs/supabase-database.md
docs/task-service.md
```

---

## Drag-and-drop

Drag-and-drop ist Board-Logik.

Die Board-Component entscheidet:

```text
Startspalte
Zielspalte
Startindex
Zielindex
neue lokale Reihenfolge
```

Persistiert wird über den `TaskService`.

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

Der Service speichert Status und Reihenfolge.  
Die Berechnung der neuen Reihenfolge bleibt in der Board-Component.

---

## Fehlerbehandlung

Fehler laufen von Supabase nach oben.

```text
Supabase Error
  ↓
Repository wirft Error
  ↓
Service setzt Fehlermeldung
  ↓
Service wirft Error weiter
  ↓
Component behandelt UI-Folge
```

Die Component entscheidet, was im UI passiert:

```text
Dialog offen lassen
Fehlermeldung anzeigen
Board neu laden
lokalen State zurücksetzen
```

---

## Ladezustand

Der `TaskService` stellt einen Ladezustand bereit:

```typescript
isLoading
```

Components verwenden diesen Zustand für:

```text
Buttons deaktivieren
Loader anzeigen
Doppel-Submits verhindern
```

Bei Bedarf können spätere Features feinere Ladezustände bekommen.

---

## Environment und Sicherheit

Environment-Dateien mit echten Supabase-Werten bleiben lokal.

Nicht committen:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Erlaubt als Vorlage:

```text
src/environments/environment.example.ts
```

Wichtig:

```text
Nur anon public key verwenden.
Niemals service_role key im Frontend speichern.
```

---

## Qualitätsregeln

Für neue oder geänderte Funktionen gilt:

- Components greifen nicht direkt auf Supabase zu.
- Components verwenden `camelCase`-Models.
- Row-Models bleiben datenbanknah.
- Mapper übernehmen Feldumwandlungen.
- Payload-Mapper bauen Supabase-Payloads.
- Services koordinieren Abläufe und State.
- Utils bleiben frei von Seiteneffekten.
- Formulare bleiben in Components.
- Drag-and-drop bleibt im Board.
- Globale SCSS-Strukturen werden nicht ohne Teamabsprache grundlegend geändert.

---

## Entscheidungshilfe

| Frage | Zielort |
|---|---|
| Betrifft es HTML, CSS, Klicks oder Formularzustand? | Component |
| Wird Supabase direkt abgefragt? | Repository |
| Wird ein Ablauf mit mehreren Datenoperationen koordiniert? | Service |
| Wird `snake_case` zu `camelCase` gewandelt? | Mapper |
| Wird `camelCase` zu `snake_case` gewandelt? | Payload-Mapper |
| Ist es eine reine Berechnung? | Utility |
| Brauchen mehrere Components denselben Datenstand? | Service |
| Ist es nur ein Dialog-, Menü- oder Animationszustand? | Component |

---

## Dokumentationsübersicht

| Dokument | Inhalt |
|---|---|
| `docs/project-architecture.md` | zentrale Architekturübersicht |
| `docs/architecture.md` | Services und Components |
| `docs/state-management.md` | Service-State und Component-State |
| `docs/conventions.md` | Code-Konventionen |
| `docs/contact-service.md` | ContactService |
| `docs/contact-components.md` | Contact-Components |
| `docs/task-service.md` | TaskService |
| `docs/task-data-layer.md` | Models, Mapper, Repository, Utils |
| `docs/task-service-integration.md` | Nutzung des TaskService in Components |
| `docs/task-components.md` | Task- und Board-Components |
| `docs/supabase-database.md` | Tabellen, Relationen und SQL-Prüfungen |
| `docs/testing-guide.md` | Test- und Review-Checklisten |
| `docs/development-workflow.md` | Git-, Branch- und Review-Regeln |

---

## Zusammenfassung

Die Architektur trennt UI, Datenlogik und Datenzugriff.

Components zeigen Daten an und reagieren auf Benutzeraktionen.  
Services koordinieren fachliche Abläufe und gemeinsamen State.  
Repositories sprechen direkt mit Supabase.  
Mapper übersetzen zwischen Datenbank und Angular.  
Utils enthalten reine Berechnungen.

Dadurch bleibt das Projekt verständlich, wartbar und im Team besser reviewbar.