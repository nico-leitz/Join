# Supabase-Datenbank

Dieses Dokument beschreibt die Supabase-Datenbankstruktur für Tasks, Subtasks, Kontakte und Kontaktzuweisungen.

Ziel ist, nachvollziehbar zu machen:

- welche Tabellen beteiligt sind
- welche Daten dauerhaft gespeichert werden
- wie Tasks, Subtasks und Kontakte miteinander verbunden sind
- warum Kontaktzuweisungen nicht direkt im Task gespeichert werden
- welche Tabellen beim Lesen und Schreiben verwendet werden
- welche Sicherheitsregeln für die Demo-Phase gelten

---

## Überblick

Das Task-System verwendet mehrere Tabellen:

```text
tasks
subtasks
task_assignments
contacts
```

Ein Task besteht fachlich aus einer Karte im Board.  
Subtasks sind eigene Datensätze und gehören über `task_id` zu einem Task.  
Kontaktzuweisungen werden über `task_assignments` gespeichert.  
Die Kontaktdaten selbst liegen in `contacts`.

Dadurch bleibt die Datenbank normalisiert. Tasks speichern keine verschachtelten Arrays mit Subtasks oder Kontakten.

---

## Warum die Daten getrennt gespeichert werden

Ein Task kann mehrere Subtasks haben.  
Ein Task kann mehreren Kontakten zugewiesen sein.  
Ein Kontakt kann mehreren Tasks zugewiesen sein.

Diese Beziehungen lassen sich sauberer über eigene Tabellen abbilden als über Arrays im Task-Datensatz.

Nicht vorgesehen:

```text
tasks.assigned_contacts
tasks.contact_ids
tasks.subtasks
```

Vorgesehen:

```text
tasks
→ speichert Task-Daten

subtasks
→ speichert Subtasks mit task_id

task_assignments
→ speichert Beziehungen zwischen task_id und contact_id

contacts
→ speichert Kontaktdaten
```

---

## Tabelle `tasks`

Die Tabelle `tasks` enthält die eigentlichen Board-Karten.

### Zweck

```text
Eine Zeile in tasks = eine Task-Karte im Board
```

### Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | uuid | eindeutige Task-ID |
| `title` | text | Titel der Aufgabe |
| `description` | text | Beschreibung der Aufgabe |
| `due_date` | date | Fälligkeitsdatum |
| `priority` | text | Priorität |
| `category` | text | Kategorie |
| `status` | text | Board-Spalte |
| `sort_order` | integer | Reihenfolge innerhalb einer Spalte |
| `created_at` | timestamptz | Erstellzeitpunkt |
| `updated_at` | timestamptz | letzter Änderungszeitpunkt |

### Erlaubte Werte

#### `priority`

```text
urgent
medium
low
```

#### `category`

```text
technical_task
user_story
```

#### `status`

```text
todo
in_progress
awaiting_feedback
done
```

Diese Werte passen zu den TypeScript-Typen im Frontend.

---

## Beispielstruktur `tasks`

```sql
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  due_date date not null,
  priority text not null default 'medium',
  category text not null,
  status text not null default 'todo',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_priority_check
    check (priority in ('urgent', 'medium', 'low')),

  constraint tasks_category_check
    check (category in ('technical_task', 'user_story')),

  constraint tasks_status_check
    check (status in ('todo', 'in_progress', 'awaiting_feedback', 'done'))
);
```

---

## Tabelle `subtasks`

Die Tabelle `subtasks` enthält die Checklistenpunkte eines Tasks.

### Zweck

```text
Eine Zeile in subtasks = ein Subtask eines Tasks
```

### Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | uuid | eindeutige Subtask-ID |
| `task_id` | uuid | zugehöriger Task |
| `title` | text | Titel des Subtasks |
| `is_completed` | boolean | erledigt oder offen |
| `sort_order` | integer | Reihenfolge innerhalb der Subtasks |
| `created_at` | timestamptz | Erstellzeitpunkt |
| `updated_at` | timestamptz | letzter Änderungszeitpunkt |

---

## Beziehung zwischen `tasks` und `subtasks`

Ein Task kann mehrere Subtasks haben.

```text
tasks.id
  ↓
subtasks.task_id
```

Das ist eine One-to-Many-Beziehung:

```text
Ein Task → mehrere Subtasks
Ein Subtask → genau ein Task
```

Wenn ein Task gelöscht wird, sollen seine Subtasks ebenfalls gelöscht werden.

---

## Beispielstruktur `subtasks`

```sql
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Tabelle `contacts`

Die Tabelle `contacts` enthält die Kontaktdaten.

### Zweck

```text
Eine Zeile in contacts = ein Kontakt
```

### Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | uuid | eindeutige Kontakt-ID |
| `first_name` | text | Vorname |
| `last_name` | text | Nachname |
| `email` | text | E-Mail-Adresse |
| `phone` | text/null | Telefonnummer |
| `badge_color` | text | Farbe für Kontakt-Badge |
| `created_at` | timestamptz | Erstellzeitpunkt |
| `updated_at` | timestamptz | letzter Änderungszeitpunkt |

---

## Beispielstruktur `contacts`

```sql
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  badge_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Tabelle `task_assignments`

Die Tabelle `task_assignments` speichert die dauerhafte Zuweisung zwischen Tasks und Kontakten.

### Zweck

```text
Eine Zeile in task_assignments = ein Kontakt ist einem Task zugewiesen
```

Die Tabelle enthält nicht die vollständigen Kontaktdaten.  
Sie speichert nur die Beziehung.

### Felder

| Feld | Typ | Bedeutung |
|---|---|---|
| `task_id` | uuid | zugehöriger Task |
| `contact_id` | uuid | zugewiesener Kontakt |
| `created_at` | timestamptz | Zeitpunkt der Zuweisung |

---

## Warum `task_assignments` notwendig ist

Kontaktzuweisungen werden nicht direkt im Task gespeichert.

Ein Task enthält also kein Feld wie:

```text
assignedContacts
contactIds
```

Stattdessen wird eine eigene Relationstabelle verwendet.

Das ist sinnvoll, weil:

- ein Task mehrere Kontakte haben kann
- ein Kontakt mehreren Tasks zugewiesen sein kann
- einzelne Zuweisungen gezielt gelöscht werden können
- doppelte Zuweisungen über einen Primary Key verhindert werden können
- Task- und Kontaktdaten getrennt bleiben
- die Beziehung dauerhaft gespeichert bleibt

---

## Beziehung zwischen `tasks`, `contacts` und `task_assignments`

`task_assignments` verbindet Tasks und Kontakte.

```text
tasks.id
  ↓
task_assignments.task_id

contacts.id
  ↓
task_assignments.contact_id
```

Dadurch entsteht eine Many-to-Many-Beziehung:

```text
Ein Task → mehrere Kontakte
Ein Kontakt → mehrere Tasks
```

---

## Beispielstruktur `task_assignments`

```sql
create table if not exists public.task_assignments (
  task_id uuid not null references public.tasks(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (task_id, contact_id)
);
```

Der zusammengesetzte Primary Key verhindert, dass derselbe Kontakt mehrfach demselben Task zugewiesen wird.

---

## Dauerhafte Speicherung von Kontaktzuweisungen

Wenn ein Kontakt einem Task zugewiesen wird, wird keine Änderung an `tasks` vorgenommen.

Gespeichert wird eine neue Zeile in `task_assignments`:

```text
task_id: ID des Tasks
contact_id: ID des Kontakts
```

Beispiel:

```text
Task A + Kontakt 1
Task A + Kontakt 2
Task B + Kontakt 1
```

Das bedeutet:

```text
Task A hat Kontakt 1 und Kontakt 2.
Task B hat Kontakt 1.
Kontakt 1 ist mehreren Tasks zugewiesen.
```

Die Zuweisung bleibt nach einem Reload erhalten, weil sie als eigene Datenbankzeile gespeichert ist.

---

## Unterschied zwischen Speicherung und Anzeige

Gespeichert wird nur:

```text
task_id + contact_id
```

Angezeigt werden aber vollständige Kontaktdaten:

```text
first_name
last_name
email
badge_color
```

Deshalb lädt das Repository für Detailansichten über die Relation die passenden Kontakte aus `contacts`.

```sql
select contacts(*)
from task_assignments
where task_id = '<task-id>';
```

Die UI bekommt danach fertige `Contact`-Objekte.

---

## Lesen der Board-Daten

Für das Board werden Daten getrennt geladen:

```text
tasks
subtasks
task_assignments
```

Das passiert bewusst getrennt, damit Tasks nicht durch Joins mehrfach zurückkommen.

### Tasks laden

```sql
select *
from public.tasks
order by sort_order asc, created_at asc;
```

### Alle Subtasks laden

```sql
select *
from public.subtasks
order by task_id asc, sort_order asc, created_at asc;
```

### Alle Assignment-Rows laden

```sql
select *
from public.task_assignments
order by task_id asc, created_at asc;
```

Das Frontend kann danach über `task_id` zuordnen:

```text
Welche Subtasks gehören zu welchem Task?
Welche Kontakte sind welchem Task zugewiesen?
```

---

## Schreiben eines Tasks

Beim Erstellen eines einfachen Tasks wird nur in `tasks` geschrieben.

```text
Frontend CreateTask
  ↓
Payload Mapper
  ↓
insert into tasks
```

Wenn Subtasks und Kontakte direkt mit erstellt werden, läuft es in mehreren Schritten.

```text
Task erstellen
  ↓
Task-ID erhalten
  ↓
Subtasks mit task_id erstellen
  ↓
Kontaktzuweisungen in task_assignments erstellen
```

Die Task-ID wird benötigt, weil sowohl `subtasks` als auch `task_assignments` über `task_id` auf den neuen Task verweisen.

---

## Aktualisieren eines Tasks

Beim Aktualisieren gibt es drei getrennte Bereiche:

```text
Task-Daten
Subtasks
Kontaktzuweisungen
```

Task-Daten werden in `tasks` aktualisiert.

Subtasks werden in `subtasks` erstellt, aktualisiert oder gelöscht.

Kontaktzuweisungen werden in `task_assignments` ergänzt oder entfernt.

Dadurch muss nicht immer alles neu geschrieben werden.

---

## Synchronisierung von Subtasks

Beim Bearbeiten eines Tasks wird der gewünschte Subtask-Zustand mit dem aktuellen Datenbankstand verglichen.

Dabei gilt:

```text
Subtask mit ID
→ bestehender Subtask wird aktualisiert

Subtask ohne ID
→ neuer Subtask wird erstellt

Subtask-ID fehlt im neuen Zustand
→ Subtask wird gelöscht
```

Zusätzlich wird geprüft, ob die übergebenen Subtask-IDs wirklich zum aktuellen Task gehören.

---

## Synchronisierung von Kontaktzuweisungen

Für Kontaktzuweisungen wird der gewünschte Endzustand über Kontakt-IDs beschrieben.

Der Service lädt die aktuellen Kontakt-IDs aus `task_assignments` und vergleicht sie mit den gewünschten IDs.

```text
aktuelle IDs aus Supabase
gewünschte IDs aus der Komponente
```

Daraus entstehen:

```text
addedIds
→ neue Zuweisungen

removedIds
→ zu löschende Zuweisungen
```

Bestehende Zuweisungen bleiben unverändert.

---

## Löschen eines Tasks

Ein Task wird aus `tasks` gelöscht.

Durch `on delete cascade` sollen zugehörige Daten automatisch entfernt werden:

```text
subtasks
task_assignments
```

Dadurch bleiben keine verwaisten Subtasks oder Kontaktzuweisungen zurück.

Die Kontakte selbst werden nicht gelöscht.

```text
Task löschen
→ Subtasks löschen
→ Assignment-Zeilen löschen
→ Kontakte bleiben erhalten
```

---

## Löschen eines Kontakts

Wenn ein Kontakt gelöscht wird, sollen seine Assignment-Zeilen ebenfalls entfernt werden.

```text
Kontakt löschen
→ passende task_assignments löschen
→ Tasks bleiben erhalten
```

Dadurch kann kein Task mehr auf einen nicht vorhandenen Kontakt verweisen.

---

## RLS-Status

Für die gemeinsame Demo- und Entwicklungsphase können die Policies offen sein für:

```text
anon
authenticated
```

Diese Einstellung ist nur für Entwicklung und Präsentation gedacht.

Für eine produktive Anwendung ist diese Konfiguration nicht ausreichend.

Vor produktiver Nutzung müssten geprüft werden:

- Authentifizierung
- Benutzer- oder Workspace-Zuordnung
- eingeschränkte Lese- und Schreibrechte
- getrennte Demo- und Produktionsdaten
- Schutz vor unberechtigten Updates und Deletes

---

## Beispiel-Policies für die Demo-Phase

Die folgenden Policies sind nur als einfache Demo-Variante gedacht.

```sql
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.contacts enable row level security;
```

```sql
create policy "Allow demo read tasks"
on public.tasks
for select
to anon, authenticated
using (true);

create policy "Allow demo write tasks"
on public.tasks
for all
to anon, authenticated
using (true)
with check (true);
```

Das gleiche Prinzip kann für `subtasks`, `task_assignments` und `contacts` verwendet werden.

Wichtig: Diese Policies sind bewusst offen und nicht für echte produktive Daten geeignet.

---

## Index-Empfehlungen

Für häufige Abfragen sind diese Indizes sinnvoll:

```sql
create index if not exists tasks_status_sort_order_idx
on public.tasks (status, sort_order);

create index if not exists subtasks_task_id_sort_order_idx
on public.subtasks (task_id, sort_order);

create index if not exists task_assignments_task_id_idx
on public.task_assignments (task_id);

create index if not exists task_assignments_contact_id_idx
on public.task_assignments (contact_id);
```

Sie unterstützen typische Abfragen wie:

```text
Tasks nach Status anzeigen
Subtasks eines Tasks laden
Zuweisungen eines Tasks laden
Tasks eines Kontakts finden
```

---

## Prüfqueries

### Anzahl Tasks pro Status

```sql
select
  status,
  count(*) as task_count
from public.tasks
group by status
order by status;
```

### Subtask-Übersicht

```sql
select
  count(*) as subtask_count,
  count(*) filter (
    where is_completed = true
  ) as completed_subtask_count
from public.subtasks;
```

### Assignment-Anzahl

```sql
select
  count(*) as assignment_count
from public.task_assignments;
```

### Tasks mit Subtask-Anzahl

```sql
select
  tasks.id,
  tasks.title,
  count(subtasks.id) as subtask_count
from public.tasks
left join public.subtasks
  on subtasks.task_id = tasks.id
group by tasks.id, tasks.title
order by tasks.title;
```

### Tasks mit Kontaktzuweisungen

```sql
select
  tasks.id,
  tasks.title,
  count(task_assignments.contact_id) as assigned_contact_count
from public.tasks
left join public.task_assignments
  on task_assignments.task_id = tasks.id
group by tasks.id, tasks.title
order by tasks.title;
```

### Zuweisungen mit Kontaktdaten

```sql
select
  tasks.title as task_title,
  contacts.first_name,
  contacts.last_name,
  contacts.email
from public.task_assignments
join public.tasks
  on tasks.id = task_assignments.task_id
join public.contacts
  on contacts.id = task_assignments.contact_id
order by tasks.title, contacts.first_name;
```

---

## Testdaten prüfen

Nach dem Einfügen von Testdaten sollte geprüft werden:

```text
Tasks vorhanden
Subtasks vorhanden
Kontakte vorhanden
task_assignments vorhanden
keine Zuweisung ohne gültigen Task
keine Zuweisung ohne gültigen Kontakt
keine Subtasks ohne gültigen Task
```

### Verwaiste Subtasks prüfen

```sql
select subtasks.*
from public.subtasks
left join public.tasks
  on tasks.id = subtasks.task_id
where tasks.id is null;
```

Erwartung:

```text
keine Zeilen
```

### Verwaiste Assignments prüfen

```sql
select task_assignments.*
from public.task_assignments
left join public.tasks
  on tasks.id = task_assignments.task_id
left join public.contacts
  on contacts.id = task_assignments.contact_id
where tasks.id is null
   or contacts.id is null;
```

Erwartung:

```text
keine Zeilen
```

---

## Abgleich mit dem Frontend

Die Datenbank verwendet `snake_case`.

Beispiele:

```text
due_date
sort_order
created_at
updated_at
task_id
is_completed
contact_id
```

Angular verwendet `camelCase`.

Beispiele:

```text
dueDate
sortOrder
createdAt
updatedAt
taskId
isCompleted
contactId
```

Die Umwandlung passiert über Mapper. Komponenten sollen keine Datenbankfeldnamen verwenden.

---

## Wichtige Regeln

- Tasks speichern keine Kontaktarrays.
- Tasks speichern keine Subtaskarrays.
- Subtasks gehören über `task_id` zu einem Task.
- Kontaktzuweisungen werden über `task_assignments` gespeichert.
- Kontakte bleiben unabhängig von Tasks bestehen.
- Beim Löschen eines Tasks werden Subtasks und Assignments entfernt.
- Beim Löschen eines Kontakts werden nur dessen Assignments entfernt.
- Komponenten greifen nicht direkt auf Supabase zu.
- Der Service arbeitet mit Repository, Mappern und Models.
- RLS ist in der Demo offen, aber nicht produktionssicher.

---

## Zusammenfassung

Die Supabase-Datenbank ist normalisiert aufgebaut.

`tasks` speichert die Board-Karten.  
`subtasks` speichert Checklistenpunkte zu Tasks.  
`contacts` speichert Kontaktdaten.  
`task_assignments` speichert dauerhaft die Beziehung zwischen Tasks und Kontakten.

Dadurch bleiben Daten sauber getrennt. Das Frontend kann Tasks, Subtasks und Kontakte flexibel zusammensetzen, ohne Daten doppelt oder verschachtelt in einer Tabelle speichern zu müssen.