# Supabase-Datenbank

Dieses Dokument beschreibt die Supabase-Datenbankstruktur des Join-Projekts für Kontakte, Tasks, Subtasks und Kontaktzuweisungen.

---

## Verwaltung

Die Datenbank wird aktuell über das Supabase-Dashboard verwaltet.

Verwendet werden:

- Table Editor
- SQL Editor
- Authentication-Bereich
- API-Einstellungen
- RLS-Policies

Lokale Supabase-Migrationen sind im aktuellen Projektstand nicht eingerichtet.

Datenbankänderungen müssen deshalb:

- im Team abgestimmt
- im Daily erwähnt
- in der Dokumentation nachgeführt
- in der passenden Testumgebung geprüft werden

---

## Tabellenübersicht

```text
contacts
tasks
subtasks
task_assignments
```

---

## Beziehungen

```text
tasks 1 ───── n subtasks

tasks n ───── n contacts
       über task_assignments
```

Ein Task:

- kann keine, eine oder mehrere Subtasks besitzen
- kann keinen, einen oder mehrere Kontakte besitzen

Ein Kontakt:

- kann keinem, einem oder mehreren Tasks zugewiesen sein

---

## Tabelle `contacts`

Die Contact-Tabelle wird für Kontaktverwaltung und Task-Zuweisungen verwendet.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | `uuid` | Primärschlüssel |
| `first_name` | `text` | Vorname |
| `last_name` | `text` | Nachname |
| `email` | `text` | E-Mail-Adresse |
| `phone` | `text` oder `null` | Telefonnummer |
| `badge_color` | `text` | Farbe des Initialen-Badges |
| `created_at` | `timestamptz` | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | letzter Änderungszeitpunkt |

Die Contact-Tabelle muss vorhanden sein, bevor `task_assignments` angelegt wird.

---

## Tabelle `tasks`

| Spalte | Typ | Standardwert | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Primärschlüssel |
| `title` | `text` | – | Titel des Tasks |
| `description` | `text` | `''` | Beschreibung |
| `due_date` | `date` | – | Fälligkeitsdatum |
| `priority` | `text` | `'medium'` | Priorität |
| `category` | `text` | – | Kategorie |
| `status` | `text` | `'todo'` | Board-Status |
| `sort_order` | `integer` | `0` | Reihenfolge innerhalb einer Spalte |
| `created_at` | `timestamptz` | `now()` | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | `now()` | letzter Änderungszeitpunkt |

### Erlaubte Prioritäten

```text
urgent
medium
low
```

### Erlaubte Kategorien

```text
technical_task
user_story
```

### Erlaubte Statuswerte

```text
todo
in_progress
awaiting_feedback
done
```

### Constraints

Der Titel darf nach dem Trimmen nicht leer sein:

```sql
check (length(trim(title)) > 0)
```

Die Priorität muss einem erlaubten Wert entsprechen:

```sql
check (
  priority in (
    'urgent',
    'medium',
    'low'
  )
)
```

Die Kategorie muss einem erlaubten Wert entsprechen:

```sql
check (
  category in (
    'technical_task',
    'user_story'
  )
)
```

Der Status muss einem erlaubten Wert entsprechen:

```sql
check (
  status in (
    'todo',
    'in_progress',
    'awaiting_feedback',
    'done'
  )
)
```

`sort_order` darf nicht negativ sein:

```sql
check (sort_order >= 0)
```

### Fälligkeitsdatum

Das Fälligkeitsdatum ist verpflichtend.

Die Regel, dass ein neu erstellter Task nicht in der Vergangenheit liegen darf, wird aktuell im Angular-Formular geprüft.

---

## Tabelle `subtasks`

| Spalte | Typ | Standardwert | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Primärschlüssel |
| `task_id` | `uuid` | – | Fremdschlüssel zum Task |
| `title` | `text` | – | Titel des Subtasks |
| `is_completed` | `boolean` | `false` | Erledigt-Status |
| `sort_order` | `integer` | `0` | Reihenfolge |
| `created_at` | `timestamptz` | `now()` | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | `now()` | letzter Änderungszeitpunkt |

### Fremdschlüssel

```text
subtasks.task_id
    ↓
tasks.id
```

Beim Löschen eines Tasks werden dessen Subtasks automatisch gelöscht:

```sql
on delete cascade
```

### Constraints

Der Titel darf nicht leer sein:

```sql
check (length(trim(title)) > 0)
```

`sort_order` darf nicht negativ sein:

```sql
check (sort_order >= 0)
```

---

## Tabelle `task_assignments`

Die Tabelle bildet die n:m-Beziehung zwischen Tasks und Kontakten ab.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `task_id` | `uuid` | Fremdschlüssel zu `tasks.id` |
| `contact_id` | `uuid` | Fremdschlüssel zu `contacts.id` |
| `created_at` | `timestamptz` | Erstellungszeitpunkt |

### Zusammengesetzter Primärschlüssel

```text
task_id + contact_id
```

Dadurch kann derselbe Kontakt einem Task nicht doppelt zugewiesen werden.

### Fremdschlüssel

```text
task_assignments.task_id
    ↓
tasks.id
```

```text
task_assignments.contact_id
    ↓
contacts.id
```

Beide Beziehungen verwenden:

```sql
on delete cascade
```

Dadurch werden Zuweisungen automatisch entfernt, wenn:

- ein Task gelöscht wird
- ein Kontakt gelöscht wird

---

## Row Level Security

RLS ist auf folgenden Tabellen aktiviert:

```text
tasks
subtasks
task_assignments
```

Für die Demo- und Entwicklungsphase bestehen Policies für:

```text
anon
authenticated
```

Erlaubte Operationen:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`

### Sicherheitshinweis

Die offenen Demo-Policies sind nicht für eine produktive Anwendung mit vertraulichen Daten vorgesehen.

Vor einem Produktionseinsatz müssen Policies beispielsweise begrenzt werden auf:

- angemeldete Benutzer
- eigene Workspaces
- eigene Tasks
- Rollen oder Teamzugehörigkeiten

---

## Grants

Für die Demo-Phase wurden Rechte für folgende Rollen vergeben:

```text
anon
authenticated
```

Operationen:

```text
select
insert
update
delete
```

RLS und Grants müssen gemeinsam betrachtet werden.

Ein Grant allein umgeht keine aktivierte RLS-Policy.

---

## Zeitstempel

`created_at` wird beim Erstellen automatisch gesetzt.

`updated_at` wird derzeit von den Angular-Payload-Mappern aktualisiert:

```typescript
updated_at: new Date().toISOString()
```

Es existiert aktuell kein verpflichtender Datenbank-Trigger für `updated_at`.

Das bedeutet:

- Änderungen über den `TaskService` aktualisieren `updated_at`
- manuelle SQL-Updates müssen `updated_at` selbst setzen
- bei zukünftigen externen Clients wäre ein Trigger sinnvoll

---

## Testdaten

Für Sprint 2 sollen mindestens fünf realistische Tasks vorhanden sein.

Die Testdaten sollten enthalten:

- alle vier Statuswerte
- unterschiedliche Prioritäten
- beide Kategorien
- Tasks mit mehreren Subtasks
- erledigte und offene Subtasks
- Tasks mit Kontaktzuweisungen
- mindestens einen abgeschlossenen Task

Beispieltitel:

```text
Set up Supabase task structure
Implement Add Task form
Build board task cards
Add task detail editing
Complete sprint review checklist
```

---

## Datenbank prüfen

### Tasks nach Status

```sql
select
  status,
  count(*) as task_count
from public.tasks
group by status
order by status;
```

### Subtasks prüfen

```sql
select
  count(*) as subtask_count,
  count(*) filter (
    where is_completed = true
  ) as completed_subtask_count
from public.subtasks;
```

### Zuweisungen prüfen

```sql
select
  count(*) as assignment_count
from public.task_assignments;
```

### Task mit Relationsdaten prüfen

```sql
select
  task.title,
  task.status,
  task.priority,
  count(distinct subtask.id) as subtask_count,
  count(distinct assignment.contact_id) as contact_count
from public.tasks task
left join public.subtasks subtask
  on subtask.task_id = task.id
left join public.task_assignments assignment
  on assignment.task_id = task.id
group by
  task.id,
  task.title,
  task.status,
  task.priority
order by
  task.status,
  task.sort_order;
```

---

## Cascade Delete prüfen

Wird ein Task gelöscht, müssen auch diese Datensätze verschwinden:

```text
subtasks
task_assignments
```

Prüfabfrage:

```sql
select count(*)
from public.subtasks
where task_id = '<task-uuid>';
```

```sql
select count(*)
from public.task_assignments
where task_id = '<task-uuid>';
```

Nach dem Löschen des Tasks müssen beide Ergebnisse `0` sein.

---

## Änderungen an der Datenbank

Vor Änderungen prüfen:

1. Ist die Änderung Bestandteil des aktuellen Sprints?
2. Sind Models und Mapper betroffen?
3. Sind Repository-Abfragen betroffen?
4. Sind bestehende Komponenten betroffen?
5. Muss die README aktualisiert werden?
6. Wurde die Änderung im Team abgestimmt?

Nach Änderungen:

```text
Build durchführen
CRUD prüfen
RLS prüfen
Cascade Delete prüfen
Dokumentation aktualisieren
Daily informieren
```