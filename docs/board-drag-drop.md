# Board Drag-and-drop

Dieses Dokument beschreibt die Drag-and-drop-Logik im Board-Bereich. Ziel ist, dass Tasks zuverlässig zwischen Spalten verschoben, innerhalb einer Spalte sortiert und dauerhaft in Supabase gespeichert werden.

---

## Grundidee

Das Board zeigt Tasks in vier Statusspalten.

```text
todo
in_progress
awaiting_feedback
done
```

Drag-and-drop verändert fachlich zwei Werte eines Tasks:

```text
status
sortOrder
```

Der `status` entscheidet, in welcher Spalte der Task angezeigt wird.  
`sortOrder` entscheidet, an welcher Position der Task innerhalb der Spalte steht.

---

## Verantwortlichkeiten

### Board Component

Die Board Component ist zuständig für:

```text
Drag-and-drop Event auswerten
Quellspalte bestimmen
Zielspalte bestimmen
neue Reihenfolge berechnen
status setzen
sortOrder setzen
optimistische UI aktualisieren
Fehler behandeln
mobile Alternative anbieten
```

### TaskService

Der `TaskService` ist zuständig für:

```text
Task aktualisieren
status speichern
sortOrder speichern
Task-State aktualisieren
Fehler weitergeben
```

Der Service berechnet nicht, welche Karte an welchem Index steht.  
Diese Information kommt aus der Board Component.

---

## Statusspalten

Die Board-Spalten sind fachlich an feste Statuswerte gebunden.

```typescript
type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'awaiting_feedback'
  | 'done';
```

UI-Anzeige:

```text
todo              → To do
in_progress       → In progress
awaiting_feedback → Await feedback
done              → Done
```

Die UI darf andere Labels anzeigen, gespeichert werden aber die technischen Statuswerte.

---

## Spaltenstruktur

Eine Board-Spalte sollte mindestens diese Informationen haben:

```typescript
interface BoardColumn {
  title: string;
  status: TaskStatus;
}
```

Beispiel:

```typescript
readonly columns: BoardColumn[] = [
  {
    title: 'To do',
    status: 'todo',
  },
  {
    title: 'In progress',
    status: 'in_progress',
  },
  {
    title: 'Await feedback',
    status: 'awaiting_feedback',
  },
  {
    title: 'Done',
    status: 'done',
  },
];
```

Dadurch sind UI-Titel und gespeicherter Status klar getrennt.

---

## Tasks pro Spalte

Tasks werden über ihren Status einer Spalte zugeordnet.

```typescript
getTasksByStatus(status: TaskStatus): Task[] {
  return this.taskService.allTasks()
    .filter((task) => {
      return task.status === status;
    })
    .sort((firstTask, secondTask) => {
      return firstTask.sortOrder - secondTask.sortOrder;
    });
}
```

Wenn die Sortierung bereits zentral über Utils passiert, sollte diese Utility verwendet werden.

---

## Drag-and-drop Daten

Ein Drag-and-drop Event liefert typischerweise:

```text
vorherige Spalte
neue Spalte
vorheriger Index
neuer Index
verschobener Task
```

Daraus berechnet die Board Component:

```text
neuer status
neue sortOrder
neue Reihenfolge der Quellspalte
neue Reihenfolge der Zielspalte
```

---

## Innerhalb einer Spalte verschieben

Wenn ein Task innerhalb derselben Spalte verschoben wird, ändert sich nur die Reihenfolge.

```text
status bleibt gleich
sortOrder ändert sich
```

Ablauf:

```text
Task innerhalb gleicher Spalte verschieben
  ↓
lokale Reihenfolge ändern
  ↓
sortOrder pro Task neu berechnen
  ↓
betroffene Tasks speichern
```

---

## In andere Spalte verschieben

Wenn ein Task in eine andere Spalte verschoben wird, ändern sich Status und Reihenfolge.

```text
status ändert sich
sortOrder ändert sich
```

Ablauf:

```text
Task aus Quellspalte entfernen
  ↓
Task in Zielspalte einfügen
  ↓
Status auf Zielstatus setzen
  ↓
sortOrder in Quellspalte neu berechnen
  ↓
sortOrder in Zielspalte neu berechnen
  ↓
Änderungen speichern
```

---

## Warum mehrere Tasks betroffen sein können

Beim Verschieben einer Karte verändert sich oft nicht nur diese eine Karte.

Beispiel:

```text
Task A sortOrder 0
Task B sortOrder 1
Task C sortOrder 2
```

Wenn Task C nach oben verschoben wird:

```text
Task C sortOrder 0
Task A sortOrder 1
Task B sortOrder 2
```

Alle betroffenen Tasks brauchen eine neue `sortOrder`.

---

## Persistenz

Gespeichert werden nur fachliche Task-Felder.

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

Wenn mehrere Tasks neu sortiert wurden, müssen mehrere Updates gespeichert werden.

```typescript
private async persistColumnOrder(tasks: Task[]): Promise<void> {
  for (const [index, task] of tasks.entries()) {
    await this.taskService.updateTask(task.id, {
      status: task.status,
      sortOrder: index,
    });
  }
}
```

---

## Reihenfolge nach Drop berechnen

Die Board Component sollte nach dem Drop eine saubere Endliste pro betroffener Spalte erzeugen.

Beispiel:

```typescript
private updateSortOrder(tasks: Task[]): Task[] {
  return tasks.map((task, index) => {
    return {
      ...task,
      sortOrder: index,
    };
  });
}
```

Diese Methode verändert nicht die Originalobjekte, sondern erzeugt neue Task-Objekte.

---

## Beispiel: Drop innerhalb einer Spalte

```typescript
async dropWithinColumn(
  tasks: Task[],
  previousIndex: number,
  currentIndex: number,
): Promise<void> {
  const reorderedTasks = [...tasks];
  const [movedTask] = reorderedTasks.splice(previousIndex, 1);

  reorderedTasks.splice(currentIndex, 0, movedTask);

  const updatedTasks = this.updateSortOrder(reorderedTasks);

  await this.persistColumnOrder(updatedTasks);
}
```

---

## Beispiel: Drop in andere Spalte

```typescript
async dropToOtherColumn(
  sourceTasks: Task[],
  targetTasks: Task[],
  previousIndex: number,
  currentIndex: number,
  targetStatus: TaskStatus,
): Promise<void> {
  const updatedSourceTasks = [...sourceTasks];
  const updatedTargetTasks = [...targetTasks];

  const [movedTask] = updatedSourceTasks.splice(previousIndex, 1);

  updatedTargetTasks.splice(currentIndex, 0, {
    ...movedTask,
    status: targetStatus,
  });

  const sourceWithOrder =
    this.updateSortOrder(updatedSourceTasks);

  const targetWithOrder =
    this.updateSortOrder(updatedTargetTasks);

  await this.persistBoardChanges([
    ...sourceWithOrder,
    ...targetWithOrder,
  ]);
}
```

---

## Persistieren mehrerer Änderungen

Wenn mehrere Tasks betroffen sind, können die Updates nacheinander gespeichert werden.

```typescript
private async persistBoardChanges(tasks: Task[]): Promise<void> {
  for (const task of tasks) {
    await this.taskService.updateTask(task.id, {
      status: task.status,
      sortOrder: task.sortOrder,
    });
  }
}
```

Für das MVP ist diese Lösung verständlich und ausreichend.

Später könnte ein Batch-Update ergänzt werden, wenn Performance relevant wird.

---

## Optimistische UI

Drag-and-drop sollte sich direkt anfühlen.

Deshalb kann die UI zuerst lokal aktualisiert werden, bevor Supabase bestätigt.

Ablauf:

```text
aktuellen Task-State merken
UI lokal ändern
Änderungen speichern
bei Erfolg Zustand behalten
bei Fehler alten Zustand wiederherstellen oder Board neu laden
```

---

## Beispiel optimistischer Ablauf

```typescript
async handleDrop(event: CdkDragDrop<Task[]>): Promise<void> {
  const previousTasks = this.taskService.allTasks();

  try {
    this.updateBoardStateLocally(event);
    await this.persistDrop(event);
  } catch (error) {
    this.taskService.allTasks.set(previousTasks);
    console.error('Task could not be moved.', error);
  }
}
```

Wichtig:  
Der alte Zustand muss vor der lokalen Änderung gesichert werden.

---

## Alternative: Board neu laden

Statt den alten lokalen Zustand wiederherzustellen, kann nach einem Fehler auch das Board neu geladen werden.

```typescript
catch (error) {
  await this.loadBoard();
  console.error('Board state was restored after failed drop.', error);
}
```

Das ist oft sicherer, weil danach wieder der tatsächliche Datenbankstand angezeigt wird.

---

## Fehlerbehandlung

Wenn Speichern fehlschlägt:

```text
Task darf nicht verschwinden
Board muss wieder konsistent sein
Fehler wird geloggt
User bekommt optional eine Meldung
Loading-State wird zurückgesetzt
```

Nicht gewünscht:

```text
Task bleibt optisch in falscher Spalte
Task verschwindet
Board zeigt doppelte Task
Reload zeigt anderen Stand ohne Hinweis
```

---

## Keine Relationsdaten verändern

Drag-and-drop verändert keine Subtasks und keine Kontaktzuweisungen.

Nicht betroffen:

```text
subtasks
task_assignments
contacts
```

Betroffen:

```text
tasks.status
tasks.sort_order
```

Das ist wichtig, damit ein einfacher Statuswechsel nicht versehentlich Relationen überschreibt.

---

## Board Relationsdaten nach Drop

Subtasks und Kontaktzuweisungen bleiben über IDs verbunden.

```text
Task.id bleibt gleich
Subtask.taskId bleibt gleich
TaskAssignmentRow.task_id bleibt gleich
```

Deshalb müssen Relationsdaten nach einem normalen Drop nicht neu erstellt werden.

Ein Reload kann trotzdem sinnvoll sein, wenn die UI nach einem Fehler wieder synchronisiert werden soll.

---

## Angular CDK

Für Drag-and-drop kann Angular CDK verwendet werden.

Typische Bausteine:

```text
CdkDropList
CdkDrag
CdkDragDrop
moveItemInArray
transferArrayItem
```

Die CDK-Hilfsfunktionen ändern lokale Arrays.  
Persistenz muss danach selbst über den Service erfolgen.

---

## Wichtig bei CDK-Listen

Jede Spalte braucht eine Drop-Liste.

```html
<div
  cdkDropList
  [cdkDropListData]="getTasksByStatus(column.status)"
  (cdkDropListDropped)="drop($event, column.status)"
>
  ...
</div>
```

Der Zielstatus sollte eindeutig aus der Zielspalte kommen.

---

## Drop-Handler

Ein Drop-Handler sollte nicht zu groß werden.

Empfohlene Aufteilung:

```text
drop()
→ Event prüfen
→ gleicher oder anderer Container?
→ lokale Aktualisierung
→ persistieren
→ Fehlerbehandlung

private Helper
→ Reihenfolge berechnen
→ Status setzen
→ sortOrder setzen
→ Updates speichern
```

So bleibt die Drag-and-drop-Logik reviewbar.

---

## Gleicher Container oder anderer Container

Das Drop-Event muss unterscheiden:

```text
previousContainer === container
→ innerhalb derselben Spalte

previousContainer !== container
→ in andere Spalte
```

Davon hängt ab, ob nur `sortOrder` oder zusätzlich `status` geändert wird.

---

## SortOrder-Regel

`sortOrder` beginnt pro Spalte bei `0`.

Beispiel:

```text
todo
  Task A sortOrder 0
  Task B sortOrder 1

done
  Task C sortOrder 0
  Task D sortOrder 1
```

Jede Spalte hat ihre eigene Reihenfolge.

---

## SortOrder nicht global zählen

Nicht gewünscht:

```text
todo Task A sortOrder 0
todo Task B sortOrder 1
done Task C sortOrder 2
done Task D sortOrder 3
```

Besser:

```text
jede Spalte sortiert unabhängig
```

Das macht Verschieben und Anzeigen einfacher.

---

## Speichern nach Reload prüfen

Nach einem erfolgreichen Drop muss ein Reload denselben Board-Zustand zeigen.

Prüfen:

```text
Task in andere Spalte ziehen
Seite neu laden
Task bleibt in Zielspalte

Task innerhalb Spalte verschieben
Seite neu laden
Reihenfolge bleibt erhalten
```

Wenn der Zustand nach Reload anders ist, wurde `status` oder `sortOrder` nicht korrekt gespeichert.

---

## Mobile Alternative

Drag-and-drop ist auf mobilen Geräten oft unzuverlässig oder schwer bedienbar.

Deshalb sollte es eine Alternative geben.

Beispiel:

```text
Move to
→ To do
→ In progress
→ Await feedback
→ Done
```

Die mobile Alternative verwendet dieselbe fachliche Logik:

```typescript
await this.taskService.updateTask(task.id, {
  status: selectedStatus,
  sortOrder: targetSortOrder,
});
```

---

## Mobile Move-Menü

Ein Task kann auf mobilen Viewports ein kleines Move-Menü anbieten.

Mögliche Optionen:

```text
Move to To do
Move to In progress
Move to Await feedback
Move to Done
```

Die aktuelle Spalte kann deaktiviert oder ausgeblendet werden.

---

## Ziel-SortOrder bei Mobile Move

Wenn ein Task mobil in eine andere Spalte verschoben wird, kann er ans Ende der Zielspalte gesetzt werden.

```typescript
private getNextSortOrder(status: TaskStatus): number {
  return this.getTasksByStatus(status).length;
}
```

Dann wird gespeichert:

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: this.getNextSortOrder(targetStatus),
});
```

Danach sollte die Quellspalte neu sortiert werden.

---

## Accessibility

Drag-and-drop allein ist nicht ausreichend barrierearm.

Wichtig:

```text
Statuswechsel auch per Button oder Menü möglich
Task Card per Tastatur öffnbar
Move-Aktion per Tastatur erreichbar
Focus sichtbar
keine reinen Maus-only-Funktionen
```

Die mobile Alternative hilft auch Tastatur- und Screenreader-Usern.

---

## Task Card und Drag

Eine Task Card kann gleichzeitig klickbar und draggable sein.

Dabei muss vermieden werden, dass Klick und Drag sich gegenseitig stören.

Prüfen:

```text
Klick öffnet Detail
Drag verschiebt Karte
Buttons innerhalb der Karte bleiben bedienbar
keine ungewollten Detailöffnungen beim Ziehen
```

Wenn nötig, kann ein eigener Drag-Handle verwendet werden.

---

## Drag Handle

Ein Drag Handle begrenzt den Ziehbereich.

```html
<div cdkDrag>
  <button
    type="button"
    cdkDragHandle
    aria-label="Move task"
  >
    ...
  </button>

  <app-task-card ... />
</div>
```

Das kann helfen, wenn Task Cards viele klickbare Bereiche enthalten.

---

## Leere Spalten

Eine leere Spalte muss weiterhin als Drop-Ziel funktionieren.

Prüfen:

```text
Spalte ohne Tasks ist sichtbar
Drop-Zone hat Mindesthöhe
Task kann in leere Spalte gezogen werden
leerer Zustand wird angezeigt
```

Beispiel-Text:

```text
No tasks in this column.
```

---

## Suche und Drag-and-drop

Wenn das Board gefiltert ist, kann Drag-and-drop schwieriger werden.

Problem:

```text
angezeigte Reihenfolge
≠ vollständige Spaltenreihenfolge
```

Für das MVP gibt es zwei einfache Optionen:

```text
1. Drag-and-drop während aktiver Suche deaktivieren
2. Drop nur innerhalb der gefilterten Ansicht erlauben und danach Board neu laden
```

Die sicherere Variante ist:

```text
Drag-and-drop bei aktiver Suche deaktivieren
```

Dadurch entstehen keine falschen `sortOrder`-Werte.

---

## Empfehlung bei aktiver Suche

Wenn `searchTerm` nicht leer ist:

```text
Drag-and-drop deaktivieren
Hinweis anzeigen oder Cards nicht draggable machen
```

Beispiel:

```html
<div
  cdkDrag
  [cdkDragDisabled]="isSearchActive()"
>
  ...
</div>
```

---

## Loading während Drop

Während ein Drop gespeichert wird, sollte verhindert werden, dass gleichzeitig weitere Drops ausgelöst werden.

Möglichkeiten:

```text
Board kurz sperren
Task Cards nicht draggable machen
Drop-Handler ignoriert weitere Events
```

Beispiel:

```typescript
if (this.isPersistingDrop()) {
  return;
}
```

---

## Testbare Drag-and-drop-Flows

Prüfen:

```text
Task innerhalb To do verschieben
Task von To do nach In progress verschieben
Task von In progress nach Await feedback verschieben
Task nach Done verschieben
Task aus Done zurück nach To do verschieben
Task in leere Spalte ziehen
Reihenfolge innerhalb Zielspalte stimmt
Reihenfolge innerhalb Quellspalte stimmt
Reload erhält Status
Reload erhält Reihenfolge
Task verschwindet nicht
Task erscheint nicht doppelt
Subtasks bleiben erhalten
Kontaktbadges bleiben erhalten
```

---

## Testbare Mobile-Flows

Prüfen:

```text
Move-Menü ist erreichbar
Task kann mobil in andere Spalte verschoben werden
aktuelle Spalte wird nicht doppelt angeboten oder ist deaktiviert
Task landet in Zielspalte
Reload erhält neuen Status
Subtasks bleiben erhalten
Kontaktzuweisungen bleiben erhalten
```

---

## Testbare Fehler-Flows

Prüfen:

```text
Supabase-Update schlägt fehl
Board stellt alten Zustand wieder her
oder Board lädt Daten neu
Task bleibt sichtbar
keine doppelte Task
Fehler wird geloggt
Loading-State wird zurückgesetzt
```

---

## Häufige Fehler vermeiden

### Nur den verschobenen Task speichern

Falsch, wenn innerhalb der Spalte sortiert wurde:

```text
nur movedTask.sortOrder speichern
```

Richtig:

```text
alle betroffenen Tasks mit neuer sortOrder speichern
```

---

### Relationsdaten überschreiben

Falsch:

```text
Drop ruft updateTaskWithRelations mit leeren subtasks oder contactIds auf
```

Richtig:

```text
Drop aktualisiert nur status und sortOrder
```

---

### Globale SortOrder verwenden

Falsch:

```text
sortOrder über alle Spalten hinweg fortlaufend
```

Richtig:

```text
sortOrder pro Spalte
```

---

### Drag-and-drop bei Suche ungeprüft erlauben

Falsch:

```text
gefilterte Ansicht sortiert vollständige Daten falsch
```

Richtig:

```text
Drag bei aktiver Suche deaktivieren oder bewusst gesondert behandeln
```

---

### Fehler ignorieren

Falsch:

```typescript
await this.persistDrop(event).catch(() => {});
```

Richtig:

```typescript
try {
  await this.persistDrop(event);
} catch (error) {
  await this.loadBoard();
  console.error('Task could not be moved.', error);
}
```

---

## Review-Checkliste

Vor Review prüfen:

```text
[ ] Tasks können innerhalb einer Spalte verschoben werden
[ ] Tasks können zwischen Spalten verschoben werden
[ ] status wird korrekt gespeichert
[ ] sortOrder wird korrekt gespeichert
[ ] Reload zeigt denselben Stand
[ ] Quellspalte wird neu sortiert
[ ] Zielspalte wird neu sortiert
[ ] leere Spalten funktionieren als Drop-Ziel
[ ] Suche verursacht keine falsche Sortierung
[ ] mobile Alternative ist vorhanden oder geplant
[ ] Fehlerfall stellt Board wieder her
[ ] Subtasks bleiben erhalten
[ ] Kontaktzuweisungen bleiben erhalten
```

---

## Abgrenzung zu anderen Dokumenten

Für TaskService-Methoden:

```text
docs/task-service.md
```

Für Board-Components:

```text
docs/task-components.md
```

Für Accessibility:

```text
docs/accessibility-ux.md
```

Für Tests:

```text
docs/testing-guide.md
```

---

## Zusammenfassung

Drag-and-drop verändert nur den Status und die Reihenfolge von Tasks.

Die Board Component berechnet Spaltenwechsel, neue Positionen und `sortOrder`.  
Der `TaskService` speichert die Änderungen.  
Subtasks und Kontaktzuweisungen bleiben unverändert.  
Nach Reload muss der Board-Zustand erhalten bleiben.  
Für mobile und barrierearme Bedienung braucht es eine Alternative zum Ziehen mit der Maus.