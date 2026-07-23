# Join

Join ist eine responsive Single-Page-Anwendung für Aufgaben-, Board- und Kontaktmanagement. Das Projekt wird als Gruppenprojekt mit Angular, TypeScript, SCSS und Supabase umgesetzt.

Der aktuelle Schwerpunkt liegt auf dem Kontaktbereich, dem Task-System und dem Kanban-Board.

---

## Projektziel

Die Anwendung soll typische Projektmanagement-Funktionen abbilden:

```text
Kontakte verwalten
Tasks erstellen und bearbeiten
Tasks im Board organisieren
Subtasks verwalten
Kontakte Tasks zuweisen
Fortschritt anzeigen
Tasks suchen und filtern
```

Die Anwendung ist für Desktop, Tablet und mobile Ansichten ausgelegt.

---

## Techstack

```text
Angular 21
TypeScript
SCSS
Supabase
RxJS
Git und GitHub
npm
Node.js
```

Die Anwendung verwendet Angular Standalone Components und Signals für zentrale UI- und Datenzustände.

---

## Team

| Teammitglied | Schwerpunkt |
|---|---|
| Basti | Struktur, Logik, Datenbanken, APIs, Supabase- und Task-Datenebene |
| Kevin | Design und Logik |
| Nico | Struktur, Logik, Datenbanken, APIs und SCSS |
| Oliver | Abstimmung innerhalb der Sprintplanung |

Die Aufgabenverteilung erfolgt im Daily und über das Trello-Board.

---

## Projektbereiche

### Kontakte

Der Kontaktbereich enthält:

```text
Kontaktliste
Kontaktdetails
Kontakt erstellen
Kontakt bearbeiten
Kontakt löschen
Success-Overlay
responsive Darstellung
```

Der zentrale Service ist:

```text
ContactService
```

Weitere Details:

```text
docs/contact-service.md
docs/contact-components.md
```

---

### Tasks und Board

Der Task-Bereich enthält:

```text
Task-CRUD
Subtasks
Kontaktzuweisungen
Board-Spalten
Task-Karten
Task-Detailansicht
Add-Task
Edit-Task
Suche
Drag-and-drop
```

Der zentrale Service ist:

```text
TaskService
```

Weitere Details:

```text
docs/task-service.md
docs/task-data-layer.md
docs/task-service-integration.md
docs/task-components.md
```

---

### Supabase

Supabase wird für die persistente Speicherung verwendet.

Wichtige Tabellen:

```text
contacts
tasks
subtasks
task_assignments
```

Kontaktzuweisungen werden nicht direkt im Task gespeichert.  
Sie werden dauerhaft über `task_assignments` als Beziehung zwischen Task und Kontakt gespeichert.

Weitere Details:

```text
docs/supabase-database.md
docs/database-architecture.md
```

---

## Grundarchitektur

Der Datenfluss ist klar geschichtet.

```text
Component
  ↓
Service
  ↓
Repository
  ↓
Supabase
```

Beim Lesen werden Datenbankzeilen in Angular-Models gemappt.

```text
Supabase Row
  ↓
Mapper
  ↓
Application Model
  ↓
Service-State
  ↓
Component
```

Beim Schreiben werden Angular-Daten in Supabase-Payloads umgewandelt.

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

Weitere Details:

```text
docs/project-architecture.md
docs/architecture.md
docs/state-management.md
docs/conventions.md
```

---

## Verantwortlichkeiten

### Components

Components sind zuständig für:

```text
Darstellung
Benutzerinteraktion
Formulare
Dialoge
lokalen UI-State
Inputs und Outputs
Lade- und Fehlerfeedback
```

Components greifen nicht direkt auf Supabase zu.

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

### Services

Services sind zuständig für:

```text
Daten laden
Daten speichern
Daten aktualisieren
Daten löschen
gemeinsamen State
Fehlerstatus
Ladezustände
Koordination mehrerer Datenoperationen
```

Beispiele:

```text
ContactService
TaskService
```

---

### Repository

Repositories kapseln direkte Supabase-Zugriffe.

Beispiel:

```text
TaskRepository
```

Das Repository kennt Tabellen, Filter und Supabase-Queries.  
Components verwenden das Repository nicht direkt.

---

### Mapper

Mapper übersetzen zwischen Datenbank und Angular.

```text
snake_case → camelCase
camelCase → snake_case
```

Beispiele:

```text
TaskRow → Task
SubtaskRow → Subtask
ContactRow → Contact
CreateTask → Supabase-Payload
```

---

### Utils

Utils enthalten reine Berechnungen ohne Seiteneffekte.

Beispiele:

```text
sortTasks()
filterTasks()
calculateSubtaskProgress()
getUniqueIds()
getMissingIds()
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
```

```text
docs/
├── allgemein.md
├── architecture.md
├── contact-components.md
├── contact-service.md
├── conventions.md
├── database-architecture.md
├── development-workflow.md
├── project-architecture.md
├── state-management.md
├── supabase-database.md
├── task-components.md
├── task-data-layer.md
├── task-service.md
├── task-service-integration.md
└── testing-guide.md
```

---

## Lokales Setup

### Repository klonen

```bash
git clone <repository-url>
cd join
```

### Eigenen Branch auschecken

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

### Abhängigkeiten installieren

```bash
npm install
```

### Anwendung starten

```bash
npm start
```

Standardmäßig läuft die Anwendung unter:

```text
http://localhost:4200
```

---

## Environment-Dateien

Die Environment-Dateien werden lokal angelegt und nicht committed.

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Beispiel:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Wichtig:

```text
Nur anon public key verwenden.
Niemals service_role key im Frontend speichern.
```

Eine Beispiel-Datei kann committed werden:

```text
src/environments/environment.example.ts
```

---

## Git-Workflow

Grundregeln:

```text
main ist der gemeinsame Produktivbranch.
Jedes Teammitglied arbeitet auf dem eigenen Branch.
Vor Arbeitsbeginn wird gepullt.
Commits bleiben klein und nachvollziehbar.
Reviews sind Pflicht.
Merges in main werden im Daily abgestimmt.
```

Commit-Format:

```text
type(scope): message
```

Beispiele:

```text
feat(tasks): add task create flow
fix(contacts): keep selected contact after update
docs(tasks): document task service data flow
style(layout): align responsive sidebar
refactor(tasks): extract task payload mapper
```

Weitere Details:

```text
docs/development-workflow.md
```

---

## Qualitätsregeln

Vor Commits und Reviews prüfen:

```bash
npm run build
git diff --check
git status --short
```

Nach Pulls oder Konflikten zusätzlich:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Erwartung:

```text
Build erfolgreich
keine Whitespace-Fehler
keine Konfliktmarker
keine ungewollten Dateien
keine echten Environment-Keys
```

Weitere Details:

```text
docs/testing-guide.md
```

---

## Dokumentationsübersicht

| Dokument | Inhalt |
|---|---|
| `docs/allgemein.md` | Projektüberblick und Einstieg |
| `docs/project-architecture.md` | zentrale Architekturübersicht |
| `docs/architecture.md` | Services und Components |
| `docs/state-management.md` | Service-State und Component-State |
| `docs/conventions.md` | Code-Konventionen |
| `docs/contact-service.md` | ContactService |
| `docs/contact-components.md` | Contact-Components |
| `docs/task-service.md` | TaskService |
| `docs/task-data-layer.md` | Models, Mapper, Repository und Utils |
| `docs/task-service-integration.md` | Verwendung des TaskService in Components |
| `docs/task-components.md` | Task- und Board-Components |
| `docs/supabase-database.md` | Tabellen, Relationen und SQL-Prüfungen |
| `docs/database-architecture.md` | Datenbankarchitektur |
| `docs/testing-guide.md` | Test- und Review-Checklisten |
| `docs/development-workflow.md` | Git-, Branch- und Review-Regeln |

---

## Aktueller Sprint-Fokus

Der aktuelle Sprint-Fokus liegt auf:

```text
Task-Datenebene
TaskService
Task-Erstellung
Board-Darstellung
Subtasks
Kontaktzuweisungen
Drag-and-drop
Dokumentation
```

Noch durch Components vollständig anzubinden:

```text
Add-Task-Formular
Board-Spalten
Task-Karten
Task-Detaildialog
Edit-Task-Flow
mobile Alternative zum Verschieben
```

---

## Sicherheitshinweis

Die RLS-Policies können für die gemeinsame Demo- und Entwicklungsphase offen sein.

Diese Konfiguration ist nicht produktionssicher.

Vor einer produktiven Veröffentlichung müssten geprüft werden:

```text
Authentifizierung
benutzer- oder workspacebezogene Policies
minimale Datenbankrechte
Trennung von Demo- und Produktionsdaten
sichere Environment-Verwaltung
```

---

## Zusammenfassung

Join ist in klar getrennte Bereiche aufgebaut.

Components übernehmen Darstellung und Benutzerinteraktion.  
Services koordinieren Datenlogik und gemeinsamen State.  
Repositories sprechen mit Supabase.  
Mapper übersetzen Datenformen.  
Utils enthalten reine Berechnungen.  
Supabase speichert Kontakte, Tasks, Subtasks und Kontaktzuweisungen dauerhaft.

Diese Struktur hält die Anwendung nachvollziehbar, wartbar und für Reviews gut erklärbar.