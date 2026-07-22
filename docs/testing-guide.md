# Testleitfaden

Dieses Dokument beschreibt die technische und funktionale Prüfung des Join-Projekts.

---

## Testebenen

Es werden mehrere Ebenen geprüft:

1. TypeScript- und Angular-Build
2. Unit-Tests
3. Supabase-Datenbank
4. Service-Integration
5. Component-Integration
6. Responsive Verhalten
7. User Stories
8. Git- und Merge-Qualität

---

## Build

```bash
npm run build
```

Erwartung:

- keine TypeScript-Fehler
- keine Template-Fehler
- keine fehlenden Imports
- keine ungültigen Property-Bindings
- keine nicht auflösbaren Dateien

Bundle-Warnungen sind getrennt von Build-Fehlern zu bewerten.

---

## Unit-Tests

```bash
npm test
```

Besonders sinnvoll sind Tests für:

```text
task-filter.utils.ts
subtask-progress.utils.ts
task-state.utils.ts
task.mapper.ts
task-payload.mapper.ts
```

### Filtertests

- leerer Suchbegriff liefert alle Tasks
- Titel wird gefunden
- Beschreibung wird gefunden
- Groß-/Kleinschreibung wird ignoriert
- nicht passende Tasks werden entfernt
- Statusfilter liefert nur passende Tasks

### Fortschrittstests

- keine Subtasks ergibt `0/0` und `0 %`
- teilweise erledigt ergibt korrekten Prozentwert
- alle erledigt ergibt `100 %`
- Rundung ist korrekt

### State-Tests

- Tasks werden nach `sortOrder` sortiert
- Subtasks werden nach `sortOrder` sortiert
- ein Task wird über seine ID ersetzt
- ein Subtask wird über seine ID ersetzt
- doppelte IDs werden entfernt

### Mapper-Tests

- `snake_case` wird zu `camelCase`
- alle Felder werden übernommen
- leere Relationsdaten werden korrekt behandelt

### Payload-Tests

- Titel werden getrimmt
- Beschreibung wird getrimmt
- optionale Felder werden ausgelassen
- `updated_at` wird gesetzt
- Assignment-Zeilen werden korrekt erzeugt

---

## Git-Prüfung

```bash
git diff --check
```

Erwartung:

```text
keine Ausgabe
```

Status:

```bash
git status
```

Erwartung vor Abschluss:

```text
nothing to commit, working tree clean
```

Konfliktmarker suchen:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Erwartung:

```text
keine Ausgabe
```

---

## Supabase-Grundprüfung

### Tasks

```sql
select
  status,
  count(*) as task_count
from public.tasks
group by status
order by status;
```

### Subtasks

```sql
select
  count(*) as subtask_count,
  count(*) filter (
    where is_completed = true
  ) as completed_subtask_count
from public.subtasks;
```

### Zuweisungen

```sql
select
  count(*) as assignment_count
from public.task_assignments;
```

---

## CRUD-Test

### Task erstellen

Prüfen:

- Titel gespeichert
- Beschreibung gespeichert
- Datum gespeichert
- Priorität gespeichert
- Kategorie gespeichert
- Standardstatus korrekt
- Standardreihenfolge korrekt

### Task lesen

Prüfen:

- `getTasks()` lädt alle Tasks
- `getTaskById()` lädt den richtigen Task
- App-Model verwendet `camelCase`
- kein Datenbankfeldname erscheint in der Component

### Task aktualisieren

Prüfen:

- einzelne Felder können aktualisiert werden
- unveränderte Felder bleiben bestehen
- `updatedAt` ändert sich
- lokaler State wird aktualisiert

### Task löschen

Prüfen:

- Task verschwindet aus Supabase
- Task verschwindet aus `allTasks`
- selektierter Task wird zurückgesetzt
- Subtasks werden automatisch gelöscht
- Zuweisungen werden automatisch gelöscht

---

## Subtask-Test

### Erstellen

- Subtask besitzt korrekte `taskId`
- leerer Titel wird abgelehnt
- Reihenfolge wird gespeichert

### Bearbeiten

- Titel wird geändert
- Completion-Wert wird geändert
- Reihenfolge wird geändert

### Löschen

- einzelner Subtask wird gelöscht
- lokaler State wird aktualisiert

### Synchronisieren

- bestehende Subtasks werden aktualisiert
- neue Subtasks ohne ID werden erstellt
- entfernte Subtasks werden gelöscht
- doppelte IDs werden abgelehnt
- fremde Subtask-ID wird abgelehnt
- leeres Array entfernt alle Subtasks

---

## Kontaktzuweisungen testen

### Einzelne Zuweisung

- Kontakt kann zugewiesen werden
- Zuweisung ist nach Reload vorhanden
- doppelte Zuweisung wird durch Primary Key verhindert

### Einzelne Entfernung

- genau die ausgewählte Beziehung wird gelöscht
- andere Kontakte bleiben zugewiesen

### Vollständige Synchronisierung

- neue Kontakte werden ergänzt
- entfernte Kontakte werden gelöscht
- unveränderte Kontakte bleiben bestehen
- doppelte IDs im Component-Array führen nicht zu doppelten Zeilen
- leeres Array entfernt alle Zuweisungen

---

## Kombinierten Create-Flow testen

Methode:

```typescript
createTaskWithRelations()
```

Prüfen:

- Task wird erstellt
- Subtasks werden erstellt
- Kontakte werden zugewiesen
- Task-ID wird für Subtasks verwendet
- Signals werden aktualisiert
- Seite neu laden
- alle Daten bleiben vorhanden

Fehlerfall:

- ungültige Kontakt-ID übergeben
- Task-Erstellung beginnt
- Relationsschritt schlägt fehl
- Cleanup löscht den neu erzeugten Task bestmöglich
- keine verwaisten Subtasks bleiben bestehen

---

## Kombinierten Update-Flow testen

Methode:

```typescript
updateTaskWithRelations()
```

### Nur Task-Daten

```typescript
{
  task: {
    title: 'Updated title',
  },
}
```

Erwartung:

- Titel geändert
- Subtasks unverändert
- Kontakte unverändert

### Relationsdaten ändern

```typescript
{
  task: {
    priority: 'urgent',
  },
  subtasks: editedSubtasks,
  contactIds: selectedContactIds,
}
```

Erwartung:

- Priorität geändert
- Subtasks synchronisiert
- Kontakte synchronisiert

### Alle Relationen löschen

```typescript
{
  task: {},
  subtasks: [],
  contactIds: [],
}
```

Erwartung:

- Task bleibt bestehen
- alle Subtasks gelöscht
- alle Zuweisungen gelöscht

---

## Board testen

### Spalten

Vorhanden:

```text
ToDo
In Progress
Awaiting Feedback
Done
```

Prüfen:

- Tasks stehen in der richtigen Spalte
- leere Spalten zeigen einen Hinweis
- Done-Spalte besitzt kein Add-Icon
- andere Spalten besitzen Add-Icon
- Karten verschwinden nicht beim Verschieben

### Task-Karte

Anzeigen:

- Kategorie
- Titel
- Beschreibungsvorschau
- Kontaktinitialen
- Priorität
- Subtask-Fortschritt

### Suche

- Titel wird gefunden
- Beschreibung wird gefunden
- Ergebnisse ändern sich während der Eingabe
- leere Suche zeigt wieder alle Tasks
- Suche verändert keine Datenbankdaten

---

## Drag-and-drop testen

- Task kann innerhalb einer Spalte verschoben werden
- Task kann in eine andere Spalte verschoben werden
- Status wird gespeichert
- `sortOrder` wird gespeichert
- Seite neu laden
- Task bleibt in der richtigen Spalte und Position
- Quellspalte wird korrekt neu indexiert
- Zielspalte wird korrekt neu indexiert
- bei Fehlern wird die Darstellung zurückgesetzt
- kein Task verschwindet

Die mobile Alternative muss ebenfalls geprüft werden.

---

## Add-Task-Formular testen

Pflichtfelder:

- Titel
- Fälligkeitsdatum
- Kategorie

Prüfen:

- leerer Titel verhindert Submit
- fehlendes Datum verhindert Submit
- vergangenes Datum verhindert Submit
- fehlende Kategorie verhindert Submit
- Standardpriorität ist `medium`
- Status ist standardmäßig `todo`
- Kontakte können ausgewählt werden
- Dropdown schließt bei Klick außerhalb
- Subtask kann per Enter angelegt werden
- Enter im Subtaskfeld erstellt nicht den Haupttask
- Subtaskfeld wird nach Hinzufügen geleert
- Submit-Button ist während Speicherung deaktiviert
- Erfolgsmeldung wird angezeigt
- Fehler wird angezeigt

---

## Edit-Task testen

- Task-Details werden vollständig geladen
- Titel kann geändert werden
- Beschreibung kann geändert werden
- Datum kann geändert werden
- Priorität kann geändert werden
- Kategorie kann geändert werden
- Kontakte können geändert werden
- Subtasks können erstellt werden
- Subtasks können bearbeitet werden
- Subtasks können gelöscht werden
- Completion kann geändert werden
- Änderungen bleiben nach Reload bestehen

---

## Task löschen

- Task-Detail öffnen
- Delete ausführen
- Task verschwindet vom Board
- Dialog schließt
- Task ist nicht mehr in Supabase
- Subtasks sind gelöscht
- Zuweisungen sind gelöscht
- kein Konsolenfehler

---

## Responsive Tests

Mindestens prüfen:

```text
320 px
375 px
768 px
799 px
1024 px
1280 px
1440 px
1920 px
```

Prüfen:

- keine horizontalen Scrollbalken
- Board bleibt bedienbar
- mobile Navigation sichtbar
- Sidebar am richtigen Breakpoint ausgeblendet
- Dialoge bleiben vollständig erreichbar
- Buttons verschwinden nicht
- Formulare werden nicht abgeschnitten
- Subtasks laufen nicht aus Karten
- Kontaktbadges laufen nicht aus Karten
- Task-Karten bleiben lesbar
- Inhalte besitzen auf großen Monitoren eine sinnvolle Begrenzung

---

## Browserprüfung

Mindestens:

- Chromium-basierter Browser
- Firefox, sofern verfügbar
- mobile Device-Simulation in DevTools

Prüfen:

- Inputs
- Dialoge
- Scrollverhalten
- Drag-and-drop
- Fokuszustände
- Tastaturbedienung

---

## Konsolenprüfung

Vor dem Merge:

```text
keine unbehandelten Errors
keine Debug-Logs
keine fehlenden Assets
keine 404-Requests
keine Supabase-Policy-Fehler
keine ExpressionChanged-Fehler
```

---

## Sprint-2-Abschlusscheckliste

### Datenebene

- [ ] Task-CRUD funktioniert
- [ ] Subtask-CRUD funktioniert
- [ ] Kontaktzuweisungen funktionieren
- [ ] kombinierter Create-Flow funktioniert
- [ ] kombinierter Update-Flow funktioniert
- [ ] Cascade Delete funktioniert
- [ ] RLS-Policies funktionieren
- [ ] Testdaten vorhanden

### Board

- [ ] vier Spalten vorhanden
- [ ] Karten zeigen erforderliche Daten
- [ ] Suche funktioniert
- [ ] Fortschritt funktioniert
- [ ] Detaildialog funktioniert
- [ ] Drag-and-drop funktioniert
- [ ] mobile Alternative funktioniert
- [ ] Position bleibt nach Reload bestehen

### Add Task

- [ ] Pflichtfelder validiert
- [ ] kein vergangenes Datum
- [ ] Standardpriorität `medium`
- [ ] Kontakte auswählbar
- [ ] Subtasks verwaltbar
- [ ] vollständiger Task wird gespeichert

### Qualität

- [ ] `npm run build` erfolgreich
- [ ] Unit-Tests erfolgreich
- [ ] keine Konsolenfehler
- [ ] keine Konfliktmarker
- [ ] Git-Status sauber
- [ ] Dokumentation aktuell
- [ ] Pull Request reviewed
- [ ] Daily über Datenbankänderungen informiert