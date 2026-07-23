# Testleitfaden

Dieses Dokument beschreibt, wie der aktuelle Projektstand geprüft wird. Ziel ist, Fehler früh zu finden und vor Reviews sicherzustellen, dass Services, Components, Datenbank und UI-Flows zusammen funktionieren.

---

## Grundregel

Vor jedem Commit und vor jedem Review müssen mindestens diese Checks laufen:

```bash
npm run build
git diff --check
git status --short
```

Zusätzlich nach Pulls oder Konflikten:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Erwartung:

```text
keine Build-Fehler
keine Whitespace-Fehler
keine Konfliktmarker
keine ungewollten Dateien im Git-Status
```

---

## Testebenen

Geprüft wird auf mehreren Ebenen:

```text
1. Build
2. Git-Status
3. Services
4. Repository und Supabase
5. Mapper und Payload-Mapper
6. Utils
7. Components
8. User-Flows
9. Responsive Verhalten
10. Browser-Konsole
```

---

## Build prüfen

```bash
npm run build
```

Der Build muss erfolgreich sein.

Ein Build darf nicht fehlschlagen durch:

- TypeScript-Fehler
- fehlende Imports
- falsche Component-Bindings
- fehlende Dateien
- falsche Asset-Pfade
- ungültige SCSS-Imports
- Template-Fehler

Build-Warnungen werden bewertet, blockieren aber nur dann, wenn sie für den Sprint relevant sind.

---

## Git prüfen

Vor dem Commit:

```bash
git status --short
```

Es dürfen nur Dateien auftauchen, die bewusst committed werden sollen.

Nicht committen:

```text
lokale Bundle-Dateien
Environment-Dateien mit echten Keys
temporäre Testdateien
Debug-Dateien
```

Beispiele:

```text
join-task-service-docs-bundle.md
join-task-service-internals-bundle.md
src/environments/environment.ts
src/environments/environment.development.ts
```

Whitespace prüfen:

```bash
git diff --check
```

Konfliktmarker prüfen:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

---

## Service-Tests

Services werden geprüft, weil sie die zentrale Datenlogik enthalten.

Wichtig sind:

```text
ContactService
TaskService
SupabaseService
```

---

## ContactService prüfen

### Kontakte laden

Prüfen:

- `getContacts()` lädt Kontakte aus Supabase.
- Kontakte werden als `Contact[]` zurückgegeben.
- Datenbankfelder werden zu `camelCase` gemappt.
- Kontakte sind alphabetisch nach Vor- und Nachname sortiert.
- Components arbeiten nicht mit `ContactRow`.

### Kontakt erstellen

Prüfen:

- Kontakt wird in Supabase gespeichert.
- `allContacts` wird aktualisiert.
- neuer Kontakt wird einsortiert.
- neuer Kontakt wird als `selectedContact` gesetzt.
- Badge-Farbe wird erzeugt.
- Telefonnummer wird bei leerem Wert als `null` gespeichert.

### Kontakt aktualisieren

Prüfen:

- nur übergebene Felder werden aktualisiert.
- `updatedAt` ändert sich.
- Kontakt wird in `allContacts` ersetzt.
- `selectedContact` wird aktualisiert.
- Liste bleibt nach Namensänderung sortiert.

### Kontakt löschen

Prüfen:

- Kontakt wird aus Supabase gelöscht.
- Kontakt wird aus `allContacts` entfernt.
- wenn der Kontakt ausgewählt war, wird `selectedContact` geleert.
- wenn ein anderer Kontakt ausgewählt war, bleibt dieser erhalten.

---

## TaskService prüfen

Der `TaskService` ist komplexer, weil Tasks aus mehreren Tabellen bestehen.

Beteiligte Daten:

```text
tasks
subtasks
task_assignments
contacts
```

---

## Tasks laden

Prüfen:

- `getTasks()` lädt alle Tasks.
- `allTasks` wird gesetzt.
- Rückgabe ist `Task[]`, nicht `TaskRow[]`.
- Felder wie `due_date` und `sort_order` werden zu `dueDate` und `sortOrder`.
- Reihenfolge ist nach `sortOrder` und `createdAt` nachvollziehbar.

---

## Board-Relationsdaten laden

Methode:

```typescript
loadAllBoardData()
```

Prüfen:

- alle Subtasks werden geladen.
- alle Assignment-Rows werden geladen.
- Subtasks werden gemappt.
- Assignments bleiben als Relationsdaten erhalten.
- Board kann Subtasks über `taskId` zuordnen.
- Board kann Kontaktzuweisungen über `task_id` und `contact_id` zuordnen.

---

## Task erstellen

### Einfacher Task

Methode:

```typescript
createTask()
```

Prüfen:

- Task wird in `tasks` gespeichert.
- `allTasks` wird aktualisiert.
- neuer Task wird ausgewählt.
- Pflichtfelder sind vorhanden.
- optionale Felder verwenden Defaults oder bleiben leer.

### Task mit Relationen

Methode:

```typescript
createTaskWithRelations()
```

Prüfen:

- Task wird zuerst erstellt.
- erzeugte Task-ID wird für Subtasks verwendet.
- Subtasks werden in `subtasks` gespeichert.
- Kontaktzuweisungen werden in `task_assignments` gespeichert.
- Kontakte werden nicht direkt im Task gespeichert.
- `selectedTask`, `selectedSubtasks` und `assignedContacts` werden aktualisiert.
- nach Reload bleiben Task, Subtasks und Zuweisungen erhalten.

---

## Rollback beim Erstellen prüfen

Fehlerfall testen:

```text
Task wird erstellt
Relationsschritt schlägt fehl
```

Erwartung:

- Service versucht den neu erstellten Task wieder zu löschen.
- es bleiben möglichst keine halben Datenstände zurück.
- Fehler wird weitergeworfen.
- Component kann Fehler anzeigen.

---

## Task aktualisieren

### Nur Task-Daten

Methode:

```typescript
updateTask()
```

Prüfen:

- einzelne Felder können geändert werden.
- Status kann geändert werden.
- `sortOrder` kann geändert werden.
- Task wird in `allTasks` ersetzt.
- `selectedTask` wird aktualisiert, wenn der Task ausgewählt war.

### Task mit Relationen

Methode:

```typescript
updateTaskWithRelations()
```

Prüfen:

- Task-Daten werden aktualisiert.
- Subtasks werden optional synchronisiert.
- Kontaktzuweisungen werden optional synchronisiert.
- State wird aktualisiert.
- Fehler führen zu einem Refresh-Versuch des tatsächlichen Datenbankstands.

---

## Wichtig bei Updates

Diese Fälle müssen bewusst geprüft werden:

```text
subtasks: undefined
→ Subtasks bleiben unverändert

subtasks: []
→ alle Subtasks werden gelöscht

contactIds: undefined
→ Kontaktzuweisungen bleiben unverändert

contactIds: []
→ alle Kontaktzuweisungen werden gelöscht
```

Dieser Unterschied ist wichtig, damit Relationen nicht versehentlich entfernt werden.

---

## Subtasks prüfen

### Erstellen

Prüfen:

- Subtask erhält richtige `taskId`.
- Titel wird gespeichert.
- `sortOrder` wird gespeichert.
- neuer Subtask erscheint beim ausgewählten Task.

### Aktualisieren

Prüfen:

- Titel kann geändert werden.
- `isCompleted` kann geändert werden.
- `sortOrder` kann geändert werden.
- `updatedAt` ändert sich.

### Löschen

Prüfen:

- Subtask wird aus Supabase gelöscht.
- Subtask verschwindet aus `selectedSubtasks`.

### Synchronisieren

Prüfen:

- Subtasks mit ID werden aktualisiert.
- Subtasks ohne ID werden neu erstellt.
- entfernte Subtasks werden gelöscht.
- doppelte Subtask-IDs werden abgelehnt.
- fremde Subtask-IDs werden abgelehnt.

---

## Kontaktzuweisungen prüfen

Kontaktzuweisungen werden dauerhaft in `task_assignments` gespeichert.

Nicht im Task gespeichert:

```text
assignedContacts
contactIds
```

Gespeichert wird:

```text
task_id + contact_id
```

### Einzelne Zuweisung

Prüfen:

- Kontakt kann einem Task zugewiesen werden.
- Zeile entsteht in `task_assignments`.
- Zuweisung bleibt nach Reload erhalten.
- vollständige Kontaktdaten können für die Anzeige geladen werden.

### Zuweisung entfernen

Prüfen:

- passende Zeile wird aus `task_assignments` gelöscht.
- andere Zuweisungen bleiben erhalten.
- Kontakt selbst wird nicht gelöscht.

### Mehrere Zuweisungen synchronisieren

Prüfen:

- neue IDs werden ergänzt.
- entfernte IDs werden gelöscht.
- vorhandene IDs bleiben bestehen.
- doppelte IDs werden vor dem Speichern entfernt.
- leeres Array entfernt alle Zuweisungen.

---

## Repository prüfen

Das `TaskRepository` führt direkte Supabase-Abfragen aus.

Prüfen:

- jede Methode wirft Supabase-Fehler weiter.
- `select`, `insert`, `update`, `delete` funktionieren.
- Filter über `id`, `task_id` und `contact_id` greifen korrekt.
- Methoden mit leeren Arrays beenden frühzeitig und erzeugen keine unnötigen Requests.
- `getAssignedContacts()` liefert vollständige Kontakte für die UI.
- `getAssignedContactIds()` liefert nur IDs für Synchronisierung.

---

## Mapper prüfen

### `task.mapper.ts`

Prüfen:

```text
TaskRow → Task
SubtaskRow → Subtask
ContactRow → Contact
```

Wichtige Feldumwandlungen:

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

### `task-payload.mapper.ts`

Prüfen:

```text
CreateTask → Supabase-Payload
UpdateTask → Supabase-Payload
CreateSubtask → Supabase-Payload
UpdateSubtask → Supabase-Payload
contactIds → Assignment-Rows
```

Wichtig:

- Texte werden getrimmt.
- optionale Felder werden nur gesetzt, wenn sie vorhanden sind.
- `updated_at` wird bei Updates gesetzt.
- keine `undefined`-Werte überschreiben bestehende Daten.

---

## Utils prüfen

### `task-state.utils.ts`

Prüfen:

- `sortTasks()` sortiert nach `sortOrder` und `createdAt`.
- `sortSubtasks()` sortiert nach `sortOrder` und `createdAt`.
- `replaceTask()` ersetzt nur den passenden Task.
- `replaceSubtask()` ersetzt nur den passenden Subtask.
- `getUniqueIds()` entfernt doppelte IDs.
- `getMissingIds()` erkennt fehlende IDs korrekt.

### `task-filter.utils.ts`

Prüfen:

- leerer Suchbegriff gibt alle Tasks zurück.
- Suche findet Titel.
- Suche findet Beschreibung.
- Groß- und Kleinschreibung wird ignoriert.
- Statusfilter gibt nur passende Tasks zurück.
- kombinierte Filterung funktioniert.

### `subtask-progress.utils.ts`

Prüfen:

- keine Subtasks ergibt `0`.
- teilweise erledigte Subtasks ergeben korrekten Prozentwert.
- alle erledigten Subtasks ergeben `100`.
- Rundung ist korrekt.
- keine Division durch `0`.

---

## Component-Tests Kontaktbereich

Prüfen:

```text
Kontaktliste lädt.
Kontakt auswählen funktioniert.
aktiver Kontakt wird markiert.
Detailansicht zeigt richtigen Kontakt.
Create-Dialog öffnet.
Create-Dialog schließt.
Formularvalidierung verhindert ungültige Eingaben.
Kontakt wird erstellt.
neuer Kontakt ist ausgewählt.
Edit-Dialog öffnet mit richtigen Daten.
Kontakt wird aktualisiert.
Liste bleibt sortiert.
Kontakt wird gelöscht.
selectedContact wird geleert.
SuccessOverlay erscheint.
Body-Scroll wird bei Dialog geöffnet gesperrt.
Body-Scroll wird nach Dialog geschlossen wieder freigegeben.
```

---

## Component-Tests Task- und Boardbereich

Prüfen:

```text
Board lädt Tasks.
vier Statusspalten werden angezeigt.
Tasks stehen in der richtigen Spalte.
Task Card zeigt Kategorie, Titel, Beschreibung und Priorität.
Subtask-Fortschritt wird angezeigt.
Kontaktbadges werden angezeigt.
Suche filtert nach Titel und Beschreibung.
Task-Detail öffnet.
Detail zeigt Task, Subtasks und Kontakte.
Task kann erstellt werden.
Task mit Subtasks kann erstellt werden.
Task mit Kontaktzuweisungen kann erstellt werden.
Task kann bearbeitet werden.
Subtasks können bearbeitet werden.
Kontaktzuweisungen können geändert werden.
Task kann gelöscht werden.
```

---

## Drag-and-drop prüfen

Prüfen:

- Task kann innerhalb einer Spalte verschoben werden.
- Task kann in eine andere Spalte verschoben werden.
- Status wird gespeichert.
- `sortOrder` wird gespeichert.
- Reload erhält Status und Reihenfolge.
- Quellspalte wird korrekt neu indexiert.
- Zielspalte wird korrekt neu indexiert.
- bei Fehler wird UI zurückgesetzt oder Board neu geladen.
- keine Task verschwindet.

Mobile Alternative prüfen:

```text
Task kann ohne Drag-and-drop in andere Spalte verschoben werden.
Status wird gespeichert.
Reload erhält den neuen Status.
```

---

## Add-Task-Formular prüfen

Pflichtfelder:

```text
title
dueDate
category
```

Prüfen:

- leerer Titel verhindert Submit.
- fehlendes Datum verhindert Submit.
- Datum in der Vergangenheit wird abgelehnt.
- fehlende Kategorie verhindert Submit.
- Standardpriorität ist `medium`.
- Standardstatus ist `todo`.
- Kontakte können ausgewählt werden.
- Subtasks können hinzugefügt werden.
- Enter im Subtaskfeld erstellt nicht den Haupttask.
- Submit-Button ist während Speicherung deaktiviert.
- Erfolgsmeldung erscheint.
- Fehler wird angezeigt.

---

## Edit-Task-Formular prüfen

Prüfen:

- vorhandene Daten werden geladen.
- Titel kann geändert werden.
- Beschreibung kann geändert werden.
- Datum kann geändert werden.
- Priorität kann geändert werden.
- Kategorie kann geändert werden.
- Kontakte können geändert werden.
- Subtasks können erstellt werden.
- Subtasks können bearbeitet werden.
- Subtasks können gelöscht werden.
- Completion kann geändert werden.
- Änderungen bleiben nach Reload erhalten.
- `undefined` und leere Arrays werden korrekt verwendet.

---

## Supabase-Prüfqueries

### Tasks pro Status

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

## Cascade Delete prüfen

### Task löschen

Erwartung:

```text
Task wird gelöscht.
zugehörige Subtasks werden gelöscht.
zugehörige task_assignments werden gelöscht.
Kontakte bleiben erhalten.
```

### Kontakt löschen

Erwartung:

```text
Kontakt wird gelöscht.
zugehörige task_assignments werden gelöscht.
Tasks bleiben erhalten.
```

---

## Responsive Tests

Mindestens prüfen:

```text
320 px
360 px
375 px
428 px
768 px
799 px
1024 px
1280 px
1440 px
1920 px
```

Zusätzlich Querformat prüfen:

```text
Mobile Landscape
Tablet Landscape
```

Prüfen:

- keine horizontalen Scrollbalken.
- Header bleibt erreichbar.
- mobile Navigation bleibt erreichbar.
- Sidebar erscheint nur im vorgesehenen Bereich.
- Dialoge sind vollständig bedienbar.
- Close-Buttons bleiben sichtbar.
- Submit-Buttons werden nicht abgeschnitten.
- Listen scrollen kontrolliert.
- Board bleibt bedienbar.
- Task Cards bleiben lesbar.
- Kontaktbadges laufen nicht aus Karten.
- Subtasks laufen nicht aus Karten.

---

## Browser-Konsole prüfen

Vor dem Merge:

```text
keine unbehandelten Errors
keine fehlenden Assets
keine 404-Requests
keine Supabase-Policy-Fehler
keine ExpressionChanged-Fehler
keine Debug-Logs
```

`console.error` in bewusster Fehlerbehandlung ist erlaubt.  
Temporäre `console.log`-Ausgaben müssen entfernt werden.

---

## Review-Checkliste

Vor Review abhaken:

```text
[ ] npm run build erfolgreich
[ ] git diff --check ohne Ausgabe
[ ] git status geprüft
[ ] keine Konfliktmarker
[ ] keine ungewollten Dateien
[ ] keine echten Environment-Keys
[ ] ContactService-Flow geprüft, wenn Kontakte betroffen sind
[ ] TaskService-Flow geprüft, wenn Tasks betroffen sind
[ ] Datenbank geprüft, wenn Supabase betroffen ist
[ ] Components manuell getestet
[ ] Responsive geprüft, wenn UI betroffen ist
[ ] Dokumentation aktualisiert
```

---

## Sprint-2-Abschlusscheckliste

### Datenebene

```text
[ ] Task-CRUD funktioniert
[ ] Subtask-CRUD funktioniert
[ ] Kontaktzuweisungen funktionieren
[ ] createTaskWithRelations funktioniert
[ ] updateTaskWithRelations funktioniert
[ ] Cascade Delete funktioniert
[ ] Mapper funktionieren
[ ] Payload-Mapper funktionieren
[ ] Utils funktionieren
```

### Board

```text
[ ] vier Spalten vorhanden
[ ] Tasks stehen im richtigen Status
[ ] Task Cards zeigen relevante Daten
[ ] Suche funktioniert
[ ] Fortschritt funktioniert
[ ] Kontaktbadges funktionieren
[ ] Detaildialog funktioniert
[ ] Drag-and-drop funktioniert
[ ] mobile Alternative funktioniert
[ ] Status und Reihenfolge bleiben nach Reload erhalten
```

### Add/Edit Task

```text
[ ] Pflichtfelder validiert
[ ] kein vergangenes Datum
[ ] Standardpriorität korrekt
[ ] Standardstatus korrekt
[ ] Kontakte auswählbar
[ ] Subtasks verwaltbar
[ ] vollständiger Task wird gespeichert
[ ] Änderungen bleiben nach Reload erhalten
```

### Qualität

```text
[ ] Build erfolgreich
[ ] keine Konsolenfehler
[ ] keine Konfliktmarker
[ ] keine Debug-Logs
[ ] Git-Status sauber
[ ] Dokumentation aktuell
[ ] Pull Request reviewed
```

---

## Zusammenfassung

Getestet wird nicht nur, ob einzelne Methoden funktionieren. Entscheidend ist, ob der komplette Ablauf stabil ist:

```text
Component
  ↓
Service
  ↓
Repository
  ↓
Supabase
  ↓
Mapper
  ↓
State
  ↓
UI
```

Wenn Daten nach einem Reload korrekt erhalten bleiben, der lokale State synchron ist und die Components keine Datenbankdetails kennen, ist die Integration sauber.