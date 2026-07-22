# Join

Join ist eine responsive Single-Page-Anwendung für Aufgaben-, Board- und Kontaktmanagement. Das Projekt wird als Gruppenprojekt mit Angular, TypeScript, SCSS und Supabase umgesetzt.

Der aktuelle Sprint-2-Fokus liegt auf:

* Kanban-Board mit vier Statusspalten
* Erstellen, Bearbeiten und Löschen von Tasks
* Subtasks und Fortschrittsanzeigen
* Kontaktzuweisungen
* Suche über Titel und Beschreibung
* persistente Speicherung in Supabase

---

## Inhaltsverzeichnis

- [Join](#join)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Projektstatus](#projektstatus)
    - [Bereits vorhanden](#bereits-vorhanden)
    - [Durch die Feature-Komponenten anzubinden](#durch-die-feature-komponenten-anzubinden)
  - [Team und Zuständigkeiten](#team-und-zuständigkeiten)
  - [Techstack](#techstack)
  - [Voraussetzungen](#voraussetzungen)
  - [Projekt lokal einrichten](#projekt-lokal-einrichten)
    - [1. Repository klonen](#1-repository-klonen)
    - [2. Eigenen Entwicklungsbranch auschecken](#2-eigenen-entwicklungsbranch-auschecken)
    - [3. Abhängigkeiten installieren](#3-abhängigkeiten-installieren)
  - [Supabase konfigurieren](#supabase-konfigurieren)
    - [`src/environments/environment.ts`](#srcenvironmentsenvironmentts)
    - [`src/environments/environment.development.ts`](#srcenvironmentsenvironmentdevelopmentts)
  - [Anwendung starten](#anwendung-starten)
  - [Projektstruktur](#projektstruktur)
  - [Architektur](#architektur)
    - [Architekturregeln](#architekturregeln)
  - [Task-System](#task-system)
  - [Dokumentation](#dokumentation)
  - [Git-Workflow](#git-workflow)
    - [Grundregeln](#grundregeln)
    - [Commit-Beispiele](#commit-beispiele)
  - [Qualitätsregeln](#qualitätsregeln)
  - [Build und Tests](#build-und-tests)
  - [Sicherheitshinweis](#sicherheitshinweis)

---

## Projektstatus

### Bereits vorhanden

* Angular-Grundstruktur und Routing
* Sidebar, Header und mobile Navigation
* Kontaktverwaltung mit Supabase
* Supabase-Tabellen für Tasks, Subtasks und Kontaktzuweisungen
* TypeScript-Models für Datenbank- und Anwendungsdaten
* Mapper zwischen Supabase und Angular
* Repository-Schicht für Supabase-Zugriffe
* `TaskService` mit Signals und Geschäftslogik
* Task-CRUD
* Subtask-CRUD
* Kontaktzuweisungen
* kombinierte Create- und Update-Abläufe
* Such- und Statusfilter
* Berechnung des Subtask-Fortschritts
* realistische Testdaten
* Datenbank- und Cascade-Delete-Tests

### Durch die Feature-Komponenten anzubinden

* Add-Task-Formular
* Board-Spalten und Task-Karten
* Task-Detaildialog
* Edit-Task-Formular
* Drag-and-drop
* mobile Alternative zum Verschieben
* Sucheingabe
* Fortschrittsanzeige
* Lade-, Erfolgs- und Fehlerfeedback

---

## Team und Zuständigkeiten

| Teammitglied | Schwerpunkte                                                      |
| ------------ | ----------------------------------------------------------------- |
| Basti        | Struktur, Logik, Datenbanken, APIs, Supabase- und Task-Datenebene |
| Kevin        | Design und Logik                                                  |
| Nico         | Struktur, Logik, Datenbanken, APIs und SCSS                       |
| Oliver       | Zuständigkeit wird innerhalb der Sprintplanung abgestimmt         |

Die konkrete Aufgabenverteilung wird im Daily und im Trello-Board abgestimmt.

Aufgaben werden nicht ohne Absprache:

* verschoben
* übernommen
* neu verteilt
* aus dem Sprint entfernt

---

## Techstack

* Angular 21
* TypeScript 5.9
* SCSS
* Supabase JavaScript Client 2
* RxJS
* Git und GitHub
* npm 11
* Node.js 24

---

## Voraussetzungen

Folgende Programme müssen installiert sein:

```text
Node.js 24.x
npm 11.x
Git
Angular CLI 21.x
Visual Studio Code
```

Versionen prüfen:

```bash
node --version
npm --version
git --version
ng version
```

---

## Projekt lokal einrichten

### 1. Repository klonen

```bash
git clone <repository-url>
cd join
```

### 2. Eigenen Entwicklungsbranch auschecken

```bash
git fetch origin
git switch <dein-branch>
git pull origin <dein-branch>
```

Beispiel:

```bash
git switch Basti
git pull origin Basti
```

### 3. Abhängigkeiten installieren

```bash
npm install
```

Die Paketversionen werden über diese Dateien festgelegt:

```text
package.json
package-lock.json
```

Das Lockfile darf nicht ohne Grund gelöscht oder neu erzeugt werden.

---

## Supabase konfigurieren

Die Environment-Dateien sind aus Sicherheitsgründen von Git ausgeschlossen. Jedes Teammitglied legt sie lokal an.

### `src/environments/environment.ts`

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

### `src/environments/environment.development.ts`

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Die Werte befinden sich im Supabase-Dashboard in den API-Einstellungen des Projekts.

Die zentrale Konfiguration liegt in:

```text
src/app/core/supabase/supabase.config.ts
src/app/core/supabase/supabase.ts
```

Komponenten greifen nicht direkt auf den Supabase Client zu.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

---

## Anwendung starten

```bash
npm start
```

Das npm-Script startet:

```bash
ng serve -o
```

Standardmäßig ist die Anwendung erreichbar unter:

```text
http://localhost:4200
```

Ist Port 4200 bereits belegt:

```bash
ng serve --port 4201 -o
```

---

## Projektstruktur

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

src/styles/
├── abstracts/
├── base/
├── components/
├── layout/
├── pages/
├── themes/
├── utilities/
└── vendors/

docs/
├── project-architecture.md
├── supabase-database.md
├── task-data-layer.md
├── task-service-integration.md
├── development-workflow.md
└── testing-guide.md
```

---

## Architektur

Der Datenfluss folgt einer klaren Richtung:

```text
Angular Component
        ↓
TaskService
        ↓
TaskRepository
        ↓
Supabase
```

Beim Lesen werden Datenbankfelder über Mapper in Angular-Models umgewandelt:

```text
Supabase Row
    ↓
Mapper
    ↓
Application Model
    ↓
Service Signal oder Rückgabewert
    ↓
Component
```

Beim Schreiben läuft die Umwandlung in die andere Richtung:

```text
Component Payload
    ↓
TaskService
    ↓
Payload Mapper
    ↓
TaskRepository
    ↓
Supabase
```

### Architekturregeln

* Komponenten enthalten UI- und Interaktionslogik.
* Der `TaskService` koordiniert Geschäftsabläufe und State.
* Das `TaskRepository` enthält direkte Supabase-Abfragen.
* Mapper übersetzen zwischen `snake_case` und `camelCase`.
* Utilities bleiben frei von Angular- und Datenbankabhängigkeiten.
* Drag-and-drop bleibt in der Board-Komponente.
* Persistiert werden Status und Position über `TaskService.updateTask()`.

Weitere Informationen:

[Projektarchitektur](docs/project-architecture.md)

---

## Task-System

Die zentrale Schnittstelle für Komponenten ist:

```text
src/app/core/services/task.service.ts
```

Der Service stellt unter anderem folgende Methoden bereit:

```typescript
getTasks()
getTaskById()
getSubtasksByTaskId()
getAssignedContacts()

createTask()
createTaskWithRelations()

updateTask()
updateTaskWithRelations()

deleteTask()

createSubtask()
updateSubtask()
toggleSubtaskCompletion()
deleteSubtask()
replaceTaskSubtasks()

assignContact()
removeContactAssignment()
replaceTaskAssignments()
```

Komponenten injizieren ausschließlich den Service:

```typescript
private readonly taskService = inject(TaskService);
```

Direkte Supabase-Abfragen aus einer Komponente sind nicht vorgesehen.

Der vollständige Implementierungsleitfaden befindet sich hier:

[TaskService in Komponenten verwenden](docs/task-service-integration.md)

---

## Dokumentation

| Dokument                                                    | Inhalt                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| [Projektarchitektur](docs/project-architecture.md)          | Ordnerstruktur, Schichten, Datenfluss und Zuständigkeiten        |
| [Supabase-Datenbank](docs/supabase-database.md)             | Tabellen, Beziehungen, Constraints, RLS und Testdaten            |
| [Task-Datenebene](docs/task-data-layer.md)                  | Models, Mapper, Repository, Service und Utilities                |
| [TaskService-Integration](docs/task-service-integration.md) | Konkreter Leitfaden für Board-, Add-Task- und Detail-Komponenten |
| [Entwicklungsworkflow](docs/development-workflow.md)        | Branches, Commits, Pull Requests, Reviews und Daily              |
| [Testleitfaden](docs/testing-guide.md)                      | Build, manuelle Tests, Datenbankprüfungen und Abnahmekriterien   |

---

## Git-Workflow

### Grundregeln

1. `main` ist der gemeinsame Produktivbranch.
2. Jedes Teammitglied arbeitet auf dem eigenen Branch.
3. Vor Arbeitsbeginn wird gepullt.
4. Nach einem Daily oder Merge wird erneut gepullt.
5. Config-Dateien werden nur nach Absprache geändert.
6. Änderungen werden in kleine, nachvollziehbare Commits aufgeteilt.
7. Pull Requests werden reviewed.
8. Der Merge in `main` wird im Daily abgestimmt.

Vor Arbeitsbeginn:

```bash
git switch <dein-branch>
git pull origin <dein-branch>
git status
```

### Commit-Beispiele

```text
feat(tasks): add task create operation
fix(tasks): prevent duplicate assignments
refactor(tasks): extract Supabase task repository
docs(tasks): document component integration
test(tasks): add task filter tests
```

Weitere Informationen:

[Entwicklungsworkflow](docs/development-workflow.md)

---

## Qualitätsregeln

* Funktionen haben eine klar erkennbare Aufgabe.
* Funktionen bleiben möglichst kurz.
* Dateien sollen möglichst nicht mehr als 400 Zeilen enthalten.
* Dateinamen sind beschreibend und konsistent.
* TypeScript verwendet `camelCase`.
* Datenbankfelder verwenden `snake_case`.
* Kommentare im Code werden auf Englisch geschrieben.
* UI-Texte orientieren sich am Figma-Design.
* Formulare verwenden Angular-Validierung statt Browser-Standardmeldungen.
* Buttons werden während laufender Speicheroperationen deaktiviert.
* Es dürfen keine unbehandelten Fehler in der Konsole verbleiben.
* Debug-Logs werden vor dem Merge entfernt.
* Responsiveness wird bis mindestens 320 Pixel Breite geprüft.
* Es dürfen keine horizontalen Scrollbalken entstehen.
* Bestehende globale SCSS-Strukturen werden nicht ohne Teamabsprache grundlegend verändert.

---

## Build und Tests

Produktionsbuild:

```bash
npm run build
```

Unit-Tests:

```bash
npm test
```

Git-Differenzen prüfen:

```bash
git diff --check
git status
```

Nach Konfliktmarkern suchen:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Weitere Prüfungen:

[Testleitfaden](docs/testing-guide.md)

---

## Sicherheitshinweis

Die aktuellen RLS-Policies sind für die gemeinsame Demo- und Entwicklungsphase offen für:

```text
anon
authenticated
```

Diese Konfiguration ist nicht für eine produktive Anwendung mit vertraulichen Daten vorgesehen.

Vor einer produktiven Veröffentlichung müssen mindestens folgende Punkte geprüft werden:

* Authentifizierung
* benutzer- oder workspacebezogene Policies
* minimale Datenbankrechte
* Schutz vor unberechtigtem Lesen und Schreiben
* sichere Verwaltung von Umgebungsvariablen
* Trennung von Demo- und Produktionsdaten
