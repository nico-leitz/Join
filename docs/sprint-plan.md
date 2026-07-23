# Sprintplan

Dieses Dokument beschreibt die Sprintstruktur im Join-Projekt. Ziel ist, den Projektverlauf nachvollziehbar zu machen und klar zu dokumentieren, welche Bereiche in welchem Sprint bearbeitet werden.

Die konkrete Aufgabenverwaltung erfolgt im Trello-Board. Dieses Dokument beschreibt nur den technischen und fachlichen Rahmen.

---

## Überblick

Das Projekt ist in drei Sprints aufgeteilt.

```text
Sprint 1
→ Kontaktbereich, Grundlayout und Supabase-Anbindung

Sprint 2
→ Task-System, Board, Subtasks und Kontaktzuweisungen

Sprint 3
→ Summary, Login, Feinschliff und Abschluss
```

Jeder Sprint hat zuerst das MVP als Ziel. Zusätzliche Features werden erst danach umgesetzt.

---

## Grundregel

Für alle Sprints gilt:

```text
MVP zuerst
Features danach
Review vor Merge
Build vor Abschluss
```

Ein Sprint gilt erst als stabil, wenn:

```text
npm run build erfolgreich ist
die wichtigsten User-Flows funktionieren
keine kritischen Konsolenfehler vorhanden sind
die Dokumentation angepasst wurde
das Team den Stand reviewed hat
```

---

## Sprint 1: Kontakte und Layout

Sprint 1 fokussiert den Kontaktbereich und die Grundstruktur der Anwendung.

### Ziele

```text
Kontaktliste
Kontaktdetails
Kontakt erstellen
Kontakt bearbeiten
Kontakt löschen
Supabase-Anbindung für Kontakte
Sidebar
Header
mobile Navigation
responsive Kontaktansicht
```

---

## Sprint-1-Ergebnis

Im Kontaktbereich wurden umgesetzt:

```text
ContactService
ContactList
ContactDetail
ContactCreateDialog
ContactEditDialog
ContactSuccessOverlay
responsive Contacts Page
Supabase CRUD für Kontakte
Kontakt-State mit Signals
alphabetische Sortierung
selectedContact-State
Validierung in Dialogen
mobile und Desktop-Ansicht
```

---

## Wichtige Sprint-1-Entscheidungen

### Kontakte werden im Service verwaltet

Der `ContactService` hält:

```text
allContacts
selectedContact
```

Dadurch können Liste und Detailansicht denselben Zustand verwenden.

---

### Dialoge speichern nicht direkt

Create- und Edit-Dialoge validieren Formulare und senden Payloads an die Page.

```text
Dialog
  ↓
submitted.emit(payload)
  ↓
Contacts Page
  ↓
ContactService
```

Das hält Dialoge unabhängig von Supabase.

---

### Kontaktliste bleibt sortiert

Kontakte werden nach Vor- und Nachname sortiert.

Nach Create oder Update wird die Liste erneut sortiert, damit die Anzeige stabil bleibt.

---

### Neuer Kontakt wird direkt ausgewählt

Nach dem Erstellen setzt der Service den neuen Kontakt als `selectedContact`.

Dadurch sieht der User sofort den neu angelegten Kontakt in der Detailansicht.

---

## Sprint-1-Reviewpunkte

Im Review wurden besonders geprüft:

```text
responsive Verhalten
Dialoge auf kleinen Displays
Close-Buttons
Button-Anordnung
Validierung
aktive Kontaktmarkierung
Detailansicht
Hover- und Fokuszustände
SCSS-Struktur
```

Umgesetzt wurden unter anderem:

```text
Fehlermeldungen unter Feldern
rote Input-Border bei Fehlern
keine nativen Browsermeldungen
Close-Buttons bleiben erreichbar
Dialoge bleiben scrollbar
mobile Success-Animation
aktive Kontaktmarkierung
alphabetische Sortierung
```

---

## Sprint 2: Tasks und Board

Sprint 2 fokussiert das Task-System und das Kanban-Board.

### Ziele

```text
Task-Datenbankstruktur
TaskService
TaskRepository
Models
Mapper
Payload-Mapper
Utils
Board-Darstellung
Task Cards
Add Task
Edit Task
Task Detail
Subtasks
Kontaktzuweisungen
Suche
Drag-and-drop
```

---

## Sprint-2-Datenstruktur

Für Tasks werden mehrere Tabellen verwendet:

```text
tasks
subtasks
task_assignments
contacts
```

Die Daten werden bewusst getrennt gespeichert.

```text
tasks
→ Task-Karten

subtasks
→ Checklistenpunkte

task_assignments
→ Verbindung zwischen Task und Kontakt

contacts
→ Kontaktdaten
```

Kontaktzuweisungen werden nicht direkt im Task gespeichert.

Gespeichert wird dauerhaft:

```text
task_id + contact_id
```

in:

```text
task_assignments
```

---

## Sprint-2-Core-Aufgaben

Im Core-Bereich werden umgesetzt:

```text
TaskService
TaskRepository
Task-Models
Subtask-Models
Assignment-Models
Persistence-Models
Task-Mapper
Payload-Mapper
State-Utils
Filter-Utils
Progress-Utils
Supabase-Konfiguration
```

---

## TaskService-Fokus

Der `TaskService` ist die zentrale Schnittstelle für Components.

Er übernimmt:

```text
Tasks laden
Task erstellen
Task aktualisieren
Task löschen
Subtasks laden
Subtasks synchronisieren
Kontaktzuweisungen laden
Kontaktzuweisungen synchronisieren
lokalen Signal-State aktualisieren
Fehlerstatus setzen
```

Der Service arbeitet bewusst mit Rows, Mappern und Relationsdaten, weil Tasks aus mehreren Tabellen zusammengesetzt werden.

Details stehen in:

```text
docs/task-service.md
docs/task-data-layer.md
docs/task-service-integration.md
```

---

## Board-Fokus

Das Board soll vier Statusspalten anzeigen:

```text
todo
in_progress
awaiting_feedback
done
```

Die Board-Component ist zuständig für:

```text
Tasks nach Status gruppieren
Task Cards anzeigen
Suche verwalten
Drag-and-drop auswerten
Task-Detail öffnen
Add-Task öffnen
lokale Relationsdaten zuordnen
```

Persistenz läuft über den `TaskService`.

---

## Add-Task-Fokus

Das Add-Task-Formular erzeugt ein:

```text
CreateTaskWithRelationsInput
```

Darin enthalten:

```text
Task-Daten
optionale Subtasks
optionale Kontakt-IDs
```

Der Service erstellt daraus:

```text
Task in tasks
Subtasks in subtasks
Zuweisungen in task_assignments
```

---

## Edit-Task-Fokus

Das Edit-Task-Formular erzeugt ein:

```text
UpdateTaskWithRelationsInput
```

Wichtig:

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

Dieser Unterschied muss im Formular bewusst behandelt werden.

---

## Drag-and-drop-Fokus

Drag-and-drop bleibt Board-Logik.

Die Board-Component berechnet:

```text
Startspalte
Zielspalte
neuer Index
neuer Status
neue sortOrder
```

Der Service speichert nur:

```text
status
sortOrder
```

Beispiel:

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

---

## Sprint-2-Offene Punkte

Je nach aktuellem Stand können noch offen sein:

```text
vollständige Board-Anbindung
Task Card UI
Task-Detaildialog
Add-Task-Formular
Edit-Task-Flow
Drag-and-drop-Persistenz
mobile Alternative zum Verschieben
Kontaktbadges auf Task Cards
Subtask-Fortschritt
Suche im Board
finale Responsive-Anpassungen
```

Offene Punkte werden im Trello-Board gepflegt und im Daily abgestimmt.

---

## Sprint 3: Summary, Login und Abschluss

Sprint 3 fokussiert die noch fehlenden Hauptbereiche und den Projektabschluss.

### Ziele

```text
Summary
Login
Auth-Flow
finale Navigation
letzte Responsive-Fixes
Bugfixing
Code Cleanup
Dokumentation finalisieren
Build prüfen
Review vorbereiten
```

---

## Sprint-3-Schwerpunkte

### Summary

Die Summary soll einen Überblick über Tasks und Status liefern.

Mögliche Inhalte:

```text
Anzahl Tasks
Tasks nach Status
dringende Tasks
nächste Deadline
Begrüßung
```

---

### Login

Der Login-Bereich wird abhängig vom finalen Projektumfang umgesetzt.

Zu klären:

```text
Supabase Auth verwenden?
Demo-Login verwenden?
Gastzugang erlauben?
RLS später einschränken?
```

Für die aktuelle Demo-Phase sind RLS-Policies bewusst offen.  
Für produktive Nutzung wäre eine echte Auth-Struktur notwendig.

---

### Abschlussarbeiten

Zum Abschluss gehören:

```text
Build prüfen
Git-Status prüfen
Konfliktmarker prüfen
Debug-Logs entfernen
Dokumentation prüfen
Responsive Tests durchführen
wichtige User-Flows testen
Review vorbereiten
```

---

## Sprintübergreifende Regeln

Für alle Sprints gelten diese Regeln:

```text
Aufgaben werden im Daily abgestimmt.
Trello wird aktuell gehalten.
Niemand übernimmt ungefragt fremde Aufgaben.
Config-Dateien werden nur nach Absprache geändert.
Datenbankänderungen werden angekündigt.
Reviews sind Pflicht.
Merges in main werden abgestimmt.
```

---

## Definition of Done

Eine Aufgabe gilt als erledigt, wenn:

```text
Funktion umgesetzt ist
MVP-Anforderung erfüllt ist
Build erfolgreich ist
keine kritischen Konsolenfehler vorhanden sind
relevante Responsive-Ansichten geprüft wurden
Code reviewed wurde
Doku angepasst wurde, wenn Architektur oder Nutzung betroffen ist
```

---

## Review vor Sprintabschluss

Vor einem Sprintabschluss prüfen:

```bash
npm run build
git diff --check
git status --short
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Zusätzlich manuell prüfen:

```text
wichtige User-Flows
responsive Darstellung
Dialoge
Formulare
Datenpersistenz nach Reload
Fehlermeldungen
Success-Feedback
```

---

## Dokumentationsbezug

Wichtige Dokumente für Sprint 2:

```text
docs/task-service.md
docs/task-data-layer.md
docs/task-service-integration.md
docs/task-components.md
docs/supabase-database.md
docs/testing-guide.md
```

Wichtige Dokumente für Sprint 3:

```text
docs/project-architecture.md
docs/development-workflow.md
docs/testing-guide.md
docs/allgemein.md
```

---

## Zusammenfassung

Der Sprintplan hält fest, welcher Projektbereich wann im Fokus steht.

Sprint 1 legt Kontakte und Layout an.  
Sprint 2 baut Tasks, Board, Subtasks und Kontaktzuweisungen.  
Sprint 3 schließt Summary, Login, Feinschliff und Abschlussprüfung ab.

Die konkrete Aufgabenverteilung bleibt im Trello-Board und wird im Daily abgestimmt.