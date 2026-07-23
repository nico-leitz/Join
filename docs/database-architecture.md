# Datenbankarchitektur

Dieses Dokument beschreibt die Architektur der Datenbank im Join-Projekt. Es erklärt, warum die Daten getrennt gespeichert werden und wie Supabase, Repository, Mapper und Services damit arbeiten.

Für konkrete Tabellenfelder, SQL-Beispiele und Prüfqueries siehe:

```text
docs/supabase-database.md
```

---

## Grundidee

Die Datenbank ist normalisiert aufgebaut.

Das bedeutet: Daten werden nicht verschachtelt oder doppelt in einer Tabelle gespeichert, sondern nach Verantwortung getrennt.

Beteiligte Haupttabellen:

```text
contacts
tasks
subtasks
task_assignments
```

Jede Tabelle hat eine klare Aufgabe.

```text
contacts
→ speichert Kontaktdaten

tasks
→ speichert Board-Karten

subtasks
→ speichert Checklistenpunkte zu Tasks

task_assignments
→ speichert Kontaktzuweisungen zu Tasks
```

---

## Warum normalisiert?

Ein Task besteht fachlich aus mehreren Teilen:

```text
Task-Daten
Subtasks
zugewiesene Kontakte
```

Diese Daten werden nicht gemeinsam in einer großen Task-Struktur gespeichert.

Nicht vorgesehen:

```text
tasks.subtasks
tasks.assignedContacts
tasks.contactIds
```

Stattdessen werden Beziehungen über IDs abgebildet.

Das hat Vorteile:

- Daten werden nicht doppelt gespeichert.
- einzelne Bereiche können getrennt geändert werden.
- Subtasks können unabhängig vom Task aktualisiert werden.
- Kontaktzuweisungen können gezielt ergänzt oder entfernt werden.
- Kontakte bleiben unabhängig von Tasks nutzbar.
- die Datenbank kann Beziehungen über Foreign Keys absichern.

---

## Tabellen und Verantwortung

### `contacts`

Speichert die eigentlichen Kontaktdaten.

Beispiele:

```text
first_name
last_name
email
phone
badge_color
```

Ein Kontakt kann unabhängig von Tasks existieren.

---

### `tasks`

Speichert die eigentlichen Board-Karten.

Beispiele:

```text
title
description
due_date
priority
category
status
sort_order
```

Ein Task speichert keine eingebetteten Subtasks und keine eingebetteten Kontakte.

---

### `subtasks`

Speichert Subtasks eines Tasks.

Jeder Subtask besitzt eine `task_id`.

```text
tasks.id
  ↓
subtasks.task_id
```

Dadurch entsteht:

```text
Ein Task → mehrere Subtasks
Ein Subtask → genau ein Task
```

---

### `task_assignments`

Speichert die Beziehung zwischen Tasks und Kontakten.

Die Tabelle enthält nur:

```text
task_id
contact_id
created_at
```

Sie speichert nicht den Namen oder die E-Mail eines Kontakts.

Dadurch entsteht:

```text
Ein Task → mehrere Kontakte
Ein Kontakt → mehrere Tasks
```

Das ist eine Many-to-Many-Beziehung.

---

## Warum Kontaktzuweisungen nicht im Task stehen

Ein Task kann mehrere Kontakte haben.  
Ein Kontakt kann aber auch mehreren Tasks zugewiesen sein.

Würde man Kontakt-IDs direkt im Task speichern, zum Beispiel als Array, wäre die Pflege schwieriger.

Nachteile eines Arrays im Task:

- einzelne Zuweisungen sind schwerer gezielt zu löschen
- doppelte IDs müssten manuell verhindert werden
- Datenbankbeziehungen wären schlechter abgesichert
- spätere Abfragen nach Kontakten und Tasks wären unübersichtlicher
- Task-Daten und Beziehungsdaten wären vermischt

Deshalb wird die Zuweisung in `task_assignments` gespeichert.

Gespeichert wird dauerhaft nur:

```text
task_id + contact_id
```

Die vollständigen Kontaktdaten werden bei Bedarf über die Relation geladen.

---

## Beziehungen

### Task zu Subtasks

```text
tasks.id
  ↓
subtasks.task_id
```

Beziehung:

```text
One-to-Many
```

Ein Task kann mehrere Subtasks besitzen.

---

### Task zu Kontakten

```text
tasks.id
  ↓
task_assignments.task_id

contacts.id
  ↓
task_assignments.contact_id
```

Beziehung:

```text
Many-to-Many
```

Ein Task kann mehrere Kontakte haben.  
Ein Kontakt kann mehreren Tasks zugewiesen sein.

---

## Cascade Delete

Die Datenbank soll abhängige Daten automatisch entfernen.

### Wenn ein Task gelöscht wird

```text
Task löschen
  ↓
zugehörige Subtasks löschen
  ↓
zugehörige task_assignments löschen
  ↓
Kontakte bleiben erhalten
```

Ein gelöschter Task soll keine verwaisten Subtasks oder Kontaktzuweisungen hinterlassen.

---

### Wenn ein Kontakt gelöscht wird

```text
Kontakt löschen
  ↓
zugehörige task_assignments löschen
  ↓
Tasks bleiben erhalten
```

Ein Kontakt kann gelöscht werden, ohne dass Tasks gelöscht werden.

---

## Row-Struktur und App-Struktur

Supabase liefert Daten in Datenbankform.

Datenbankfelder verwenden `snake_case`.

Beispiele:

```text
due_date
sort_order
created_at
updated_at
task_id
contact_id
is_completed
```

Angular verwendet `camelCase`.

Beispiele:

```text
dueDate
sortOrder
createdAt
updatedAt
taskId
contactId
isCompleted
```

Deshalb gibt es Row-Models und Application-Models.

---

## Row-Models

Row-Models spiegeln die Datenbankstruktur wider.

Beispiel:

```typescript
export interface TaskRow {
  id: string;
  title: string;
  due_date: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

Row-Models werden in datenbanknahen Bereichen genutzt:

```text
Repository
Mapper
Payload-Mapper
```

---

## Application-Models

Application-Models werden in Angular-Components und Services verwendet.

Beispiel:

```typescript
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

Components sollen keine Row-Models verwenden.

---

## Mapping

Die Umwandlung zwischen Datenbank und App passiert über Mapper.

Leserichtung:

```text
TaskRow
  ↓
mapTaskRow()
  ↓
Task
```

Beispiele:

```text
due_date   → dueDate
sort_order → sortOrder
task_id    → taskId
```

Dadurch bleiben Datenbankdetails aus den Components heraus.

---

## Payload-Mapping

Beim Schreiben läuft die Umwandlung zurück.

```text
CreateTask
  ↓
createTaskInsertPayload()
  ↓
Supabase-Payload
```

Beispiele:

```text
dueDate   → due_date
sortOrder → sort_order
taskId    → task_id
```

Der Payload-Mapper sorgt dafür, dass Components keine Supabase-Payloads bauen müssen.

---

## Repository als Datenbankzugriff

Direkte Supabase-Zugriffe liegen im Repository.

Beispiel:

```text
TaskRepository
```

Das Repository kennt:

```text
Tabellennamen
select-Abfragen
insert-Abfragen
update-Abfragen
delete-Abfragen
Filter über IDs
Sortierungen
```

Components verwenden das Repository nicht direkt.

Vorgesehen:

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

## Warum das Board Daten getrennt lädt

Das Board braucht mehrere Datenarten:

```text
Tasks
Subtasks
Kontaktzuweisungen
```

Diese werden getrennt geladen.

```text
getTasks()
loadAllBoardData()
```

Dadurch werden Tasks nicht durch Joins mehrfach zurückgegeben.

Das Board kann danach lokal zuordnen:

```text
Subtasks über taskId
Assignments über task_id
Kontakte über contact_id
```

Diese Strategie hält die Datenstruktur einfach und vermeidet viele einzelne Requests pro Task.

---

## Dauerhafte Daten und UI-Daten

Nicht alles, was die UI anzeigt, wird in genau dieser Form gespeichert.

Beispiel Kontaktbadges auf einer Task-Karte:

```text
UI zeigt:
Contact[]
```

Gespeichert wird aber:

```text
task_assignments.task_id
task_assignments.contact_id
```

Das bedeutet:

```text
Die UI bekommt fertige Daten für die Darstellung.
Die Datenbank speichert saubere Beziehungen.
```

---

## Sortierung

Tasks und Subtasks besitzen `sort_order`.

Das ermöglicht eine stabile Reihenfolge im Board und innerhalb von Subtasks.

Bei Tasks ist zusätzlich der Status wichtig:

```text
status
sort_order
```

Der Status entscheidet über die Spalte.  
`sort_order` entscheidet über die Reihenfolge innerhalb der Spalte.

---

## Statuswerte

Tasks verwenden feste Statuswerte:

```text
todo
in_progress
awaiting_feedback
done
```

Diese Werte müssen zu den TypeScript-Typen und den Board-Spalten passen.

Wenn ein Status geändert wird, verschiebt sich der Task in eine andere Spalte.

---

## Priorität und Kategorie

Auch Priorität und Kategorie verwenden feste Werte.

Priorität:

```text
urgent
medium
low
```

Kategorie:

```text
technical_task
user_story
```

Diese Werte werden im Frontend typisiert und sollten in der Datenbank über Constraints abgesichert sein.

---

## Sicherheitsstatus

Für die Demo- und Entwicklungsphase können RLS-Policies offen sein.

Das ist nur für den Projektkontext akzeptabel.

Nicht produktionssicher:

```text
anon darf alles lesen und schreiben
```

Für produktive Nutzung wären nötig:

```text
Authentifizierung
Benutzer- oder Workspace-Zuordnung
eingeschränkte Policies
getrennte Demo- und Produktivdaten
```

---

## Prüfbare Architekturregeln

Die Datenbankarchitektur gilt als korrekt umgesetzt, wenn:

- Tasks keine Kontaktarrays enthalten.
- Tasks keine Subtaskarrays enthalten.
- Subtasks über `task_id` verbunden sind.
- Kontakte über `task_assignments` zugewiesen werden.
- Kontaktzuweisungen nach Reload erhalten bleiben.
- gelöschte Tasks keine Subtasks zurücklassen.
- gelöschte Tasks keine Assignments zurücklassen.
- gelöschte Kontakte keine Assignments zurücklassen.
- Components keine Datenbankfelder verwenden.
- Mapper zwischen Row- und App-Struktur übersetzen.

---

## Abgrenzung zu anderen Dokumenten

Für konkrete Tabellenfelder und SQL:

```text
docs/supabase-database.md
```

Für Service-Abläufe:

```text
docs/task-service.md
```

Für Repository, Mapper und Utils:

```text
docs/task-data-layer.md
```

Für Component-Nutzung:

```text
docs/task-service-integration.md
```

---

## Zusammenfassung

Die Datenbankarchitektur trennt Daten nach Verantwortung.

`tasks` speichert Board-Karten.  
`subtasks` speichert Checklistenpunkte.  
`contacts` speichert Kontaktdaten.  
`task_assignments` speichert die Beziehung zwischen Tasks und Kontakten.

Diese Struktur verhindert doppelte Daten, hält Beziehungen nachvollziehbar und ermöglicht saubere Service- und Component-Logik im Frontend.