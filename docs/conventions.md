# Konventionen für Services und Components

Dieses Dokument beschreibt die wichtigsten Code-Konventionen für Services und Components im Join-Projekt.

Ziel ist, dass alle Teammitglieder Code ähnlich strukturieren, Verantwortlichkeiten klar bleiben und neue Features leichter reviewed werden können.

---

## Grundregel

Jede Datei soll eine klare Aufgabe haben.

```text
Component
→ Darstellung und Benutzerinteraktion

Service
→ Datenlogik, Geschäftsabläufe und gemeinsamer State

Repository
→ direkter Supabase-Zugriff

Mapper
→ Umwandlung zwischen Datenbank und Angular

Utils
→ reine Berechnungen
```

Wenn eine Funktion nicht eindeutig zugeordnet werden kann, sollte zuerst geklärt werden, welche Verantwortung sie hat.

---

## Sprache

Code-Kommentare werden auf Englisch geschrieben.

```typescript
// Updates the selected task state after a successful request.
```

UI-Texte orientieren sich am Figma-Design und können Deutsch oder Englisch sein, je nach aktuellem Projektstand.

Dokumentation wird im Projekt auf Deutsch geführt.

---

## Dateinamen

Dateinamen sind klein geschrieben und beschreiben den Inhalt.

Beispiele:

```text
task.service.ts
contact.service.ts
task.repository.ts
task.mapper.ts
task-payload.mapper.ts
task-state.utils.ts
contact-detail.ts
contact-create-dialog.ts
```

Nicht verwenden:

```text
helper.ts
stuff.ts
new-file.ts
logic.ts
test2.ts
```

Der Dateiname soll ohne Öffnen der Datei verständlich machen, wofür die Datei zuständig ist.

---

## Klassennamen

Klassennamen verwenden PascalCase.

```typescript
export class TaskService {}
export class ContactService {}
export class ContactDetail {}
export class AddTaskDialog {}
```

Interfaces verwenden ebenfalls PascalCase.

```typescript
export interface Task {}
export interface TaskRow {}
export interface CreateTask {}
export interface UpdateTask {}
```

Variablen und Methoden verwenden camelCase.

```typescript
selectedTask
allContacts
createTask()
updateContact()
loadBoard()
```

---

## Komponentenstruktur

Eine Component sollte grob nach diesem Muster aufgebaut sein:

```typescript
@Component({
  selector: 'app-example',
  imports: [],
  templateUrl: './example.html',
  styleUrl: './example.scss',
})
export class Example {
  private readonly service = inject(ExampleService);

  readonly items = this.service.items;
  readonly isLoading = this.service.isLoading;

  async ngOnInit(): Promise<void> {
    await this.loadItems();
  }

  private async loadItems(): Promise<void> {
    // ...
  }
}
```

Empfohlene Reihenfolge:

```text
1. injects
2. inputs
3. outputs
4. public readonly state
5. private state
6. lifecycle methods
7. public template methods
8. event handler
9. private helper methods
```

---

## Servicestruktur

Ein Service sollte öffentliche Methoden von privaten Helpern trennen.

Empfohlene Reihenfolge:

```text
1. injects
2. public signals
3. public load methods
4. public create/update/delete methods
5. public relation methods
6. private refresh/helper methods
7. private state update methods
8. private error/loading helpers
```

Beispiel:

```typescript
@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly repository = inject(TaskRepository);

  readonly allTasks = signal<Task[]>([]);
  readonly isLoading = signal(false);

  async getTasks(): Promise<Task[]> {
    // ...
  }

  private prepareLoadingState(): void {
    // ...
  }
}
```

---

## Components dürfen keine Datenbanklogik enthalten

Components greifen nicht direkt auf Supabase zu.

Falsch:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Richtig:

```typescript
private readonly taskService = inject(TaskService);
```

oder:

```typescript
private readonly contactService = inject(ContactService);
```

Datenbankzugriffe bleiben in Repository oder datenbanknahen Services.

---

## Keine Datenbankfelder in Components

Components verwenden Application-Models mit `camelCase`.

Richtig:

```typescript
task.dueDate
task.sortOrder
subtask.taskId
subtask.isCompleted
contact.firstName
contact.badgeColor
```

Falsch:

```typescript
task.due_date
task.sort_order
subtask.task_id
subtask.is_completed
contact.first_name
contact.badge_color
```

Die Umwandlung zwischen Datenbank und Angular passiert in Mappern.

---

## Row-Models nur datenbanknah verwenden

Row-Models beschreiben Supabase-Daten.

Beispiele:

```text
TaskRow
SubtaskRow
TaskAssignmentRow
ContactRow
```

Diese Models werden verwendet in:

```text
Repository
Mapper
Payload-Mapper
datenbanknaher Service-Logik
```

Components sollen damit nicht arbeiten.

Components verwenden:

```text
Task
Subtask
Contact
CreateTask
UpdateTask
```

---

## Inputs

Inputs werden genutzt, wenn eine Child-Component Daten von außen bekommt.

Beispiel:

```typescript
task = input.required<Task>();
subtasks = input<Subtask[]>([]);
```

Inputs sollen nicht direkt verändert werden.

Wenn eine Component Änderungen melden muss, nutzt sie Outputs.

---

## Outputs

Outputs werden genutzt, um Aktionen an die Parent-Component zu melden.

Beispiel:

```typescript
submitted = output<CreateTaskWithRelationsInput>();
cancelled = output<void>();
deleteRequested = output<string>();
```

Die Child-Component entscheidet nicht, was danach fachlich passiert.

Sie meldet nur:

```text
User hat gespeichert.
User hat abgebrochen.
User möchte löschen.
User möchte bearbeiten.
```

Die Parent-Component ruft danach den passenden Service auf.

---

## Dialog-Konvention

Dialog-Components sollen möglichst keine Daten selbst speichern.

Vorgesehen:

```text
Dialog
  ↓
validiert Formular
  ↓
erzeugt Payload
  ↓
submitted.emit(payload)
  ↓
Parent-Component
  ↓
Service
```

Nicht vorgesehen:

```text
Dialog
  ↓
ruft Supabase direkt auf
```

oder:

```text
Dialog
  ↓
koordiniert komplette Page-Logik
```

Der Dialog bleibt dadurch wiederverwendbar und leichter testbar.

---

## Formulare

Formulare gehören in Components.

Die Component ist zuständig für:

- `FormGroup`
- `FormControls`
- Validatoren
- Fehlermeldungen
- `markAllAsTouched()`
- Erzeugen des Create- oder Update-Inputs

Der Service bekommt nur validierte Daten.

Beispiel:

```typescript
if (this.form.invalid) {
  this.form.markAllAsTouched();
  return;
}

this.submitted.emit(this.createPayload());
```

---

## Payloads in Components

Components erzeugen fachliche Payloads für Services.

Richtig:

```typescript
{
  task: {
    title: title,
    dueDate: dueDate,
    category: category,
    priority: priority,
  },
  contactIds: selectedContactIds,
}
```

Falsch:

```typescript
{
  title: title,
  due_date: dueDate,
  contact_id: contactId,
}
```

Datenbank-Payloads mit `snake_case` werden im Payload-Mapper gebaut.

---

## Signals

Signals werden für reaktiven State verwendet.

Service-State:

```typescript
readonly allTasks = signal<Task[]>([]);
readonly selectedTask = signal<Task | null>(null);
readonly isLoading = signal(false);
```

Component-State:

```typescript
readonly isDialogOpen = signal(false);
readonly searchTerm = signal('');
```

Wichtig ist die Trennung:

```text
Daten, die mehrere Components brauchen
→ Service

rein lokaler UI-Zustand
→ Component
```

---

## Public und private

Alles, was nur innerhalb einer Klasse verwendet wird, sollte `private` sein.

Beispiel:

```typescript
private createPayload(): CreateTaskWithRelationsInput {
  // ...
}
```

Öffentlich bleiben nur Methoden oder Properties, die im Template oder von außen gebraucht werden.

Dadurch bleibt klar, welche Schnittstellen wirklich genutzt werden.

---

## Methoden kurz halten

Methoden sollen möglichst eine erkennbare Aufgabe haben.

Gut:

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  await this.createTask();
}
```

Besser als eine sehr lange Methode, die gleichzeitig:

```text
validiert
Payload baut
speichert
Dialog schließt
Success setzt
Fehler behandelt
Formular zurücksetzt
```

Wenn eine Methode zu groß wird, wird Logik in private Helper ausgelagert.

---

## Namen von Methoden

Methodennamen sollen die Aktion beschreiben.

Gute Namen:

```text
loadBoard()
openCreateDialog()
closeCreateDialog()
createTaskInput()
updateTaskState()
refreshAssignedContacts()
synchronizeTaskAssignments()
```

Schlechte Namen:

```text
doStuff()
handleData()
process()
run()
test()
```

Ein Methodenname soll beim Lesen erklären, warum die Methode existiert.

---

## Async-Methoden

Async-Methoden geben immer `Promise<T>` oder `Promise<void>` an.

Beispiel:

```typescript
async loadContacts(): Promise<void> {
  // ...
}
```

Nicht:

```typescript
async loadContacts() {
  // ...
}
```

Der Rückgabetyp macht die Methode leichter nachvollziehbar.

---

## Fehlerbehandlung in Components

Service-Aufrufe in Components sollten mit `try/catch` abgesichert werden.

```typescript
try {
  await this.taskService.getTasks();
} catch (error) {
  console.error('Tasks could not be loaded.', error);
}
```

Die Component entscheidet danach über UI-Verhalten:

```text
Dialog offen lassen
Fehlermeldung anzeigen
lokalen State zurücksetzen
Daten neu laden
```

---

## Fehlerbehandlung in Services

Services setzen fachliche Fehlermeldungen und werfen Fehler weiter.

Beispiel:

```typescript
this.errorMessage.set('Task could not be updated.');
throw error;
```

Dadurch kann die Component den Fehler zusätzlich kontrolliert behandeln.

---

## Ladezustand

Während eines Requests setzt ein Service einen Ladezustand.

```typescript
this.isLoading.set(true);
```

Nach Abschluss:

```typescript
this.isLoading.set(false);
```

Components nutzen den Wert für:

```text
Buttons deaktivieren
Loader anzeigen
Doppel-Submits verhindern
```

---

## State nach Schreiboperationen aktualisieren

Nach erfolgreichen Schreiboperationen muss der lokale State aktuell sein.

Beispiele:

```text
createContact()
→ Kontakt in allContacts einfügen

updateContact()
→ Kontakt in allContacts ersetzen

deleteContact()
→ Kontakt aus allContacts entfernen

createTask()
→ Task in allTasks einfügen

updateTask()
→ Task in allTasks ersetzen

deleteTask()
→ Task aus allTasks entfernen
```

Wenn eine Component eigene lokale Kopien hält, muss sie diese nach Schreiboperationen ebenfalls aktualisieren oder neu laden.

---

## Sortierung

Sortierlogik gehört nicht mehrfach in Components.

Beispiele:

```text
Kontakte sortieren
Tasks sortieren
Subtasks sortieren
```

Wenn Sortierung an mehreren Stellen gebraucht wird, liegt sie im Service oder in einer Utility.

---

## Utils

Utils enthalten reine Funktionen.

Eine Utility-Funktion:

```text
bekommt Daten als Parameter
gibt ein Ergebnis zurück
ändert keinen externen State
ruft kein Supabase auf
nutzt keine Angular-Injection
```

Beispiele:

```text
filterTasks()
sortTasks()
sortSubtasks()
calculateSubtaskProgress()
getUniqueIds()
getMissingIds()
```

---

## Kommentare

Kommentare sollen erklären, warum etwas gemacht wird.

Gut:

```typescript
// Keeps the selected task state in sync after a relation update.
```

Nicht gut:

```typescript
// Set selected task.
```

Offensichtlicher Code braucht keinen Kommentar.

Kommentiert werden vor allem:

```text
ungewöhnliche Entscheidungen
Fallbacks
Fehlerbehandlung
Rollback
bewusste Trennung
temporäre Einschränkungen
```

---

## Kein toter Code

Vor einem Commit entfernen:

```text
auskommentierter alter Code
console.log-Debugging
ungenutzte Imports
ungenutzte Variablen
leere Methoden
Testreste
```

`console.error` in Fehlerbehandlung ist okay, wenn es bewusst gesetzt ist.

---

## Component-Templates

Templates sollen lesbar bleiben.

Wenn Bedingungen zu komplex werden, sollte Logik in TypeScript ausgelagert werden.

Nicht gut:

```html
@if (
  task.status === 'todo' &&
  subtasks.length > 0 &&
  assignedContacts.length > 0 &&
  !isLoading()
) {
  ...
}
```

Besser:

```html
@if (shouldShowTaskMeta()) {
  ...
}
```

---

## SCSS-Konvention

Component-SCSS bleibt bei der Component.

Globale SCSS-Regeln werden nur genutzt, wenn mehrere Bereiche dieselbe Regel brauchen.

Nicht ohne Absprache ändern:

```text
globale Breakpoints
globale Tokens
globale Layout-Regeln
Reset
Typography
```

Komponentenbezogene Anpassungen bleiben lokal.

---

## Barrierearme Components

Components sollen grundlegende Accessibility beachten.

Dazu gehören:

```text
Buttons für klickbare Aktionen
aria-label bei Icon-Buttons
sichtbare Focus-Zustände
keine reinen div-Klickflächen
Formularfehler unter dem Feld
logische Tab-Reihenfolge
```

Beispiel:

```html
<button
  type="button"
  aria-label="Close dialog"
>
  <img src="assets/icons/close.svg" alt="" />
</button>
```

Dekorative Icons bekommen ein leeres `alt`.

---

## Imports

Imports sollen nur enthalten, was wirklich genutzt wird.

Angular-Standalone-Components importieren benötigte Module direkt in `imports`.

Beispiel:

```typescript
@Component({
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
})
```

Ungenutzte Imports vor dem Commit entfernen.

---

## Kein unnötiger globaler State

Nicht jeder Zustand gehört in einen Service.

Falsch:

```text
isHoveringContact
isMobileMenuClosing
isDialogAnimationRunning
```

im Service.

Richtig:

```text
lokaler Component-State
```

Der Service soll nicht für reine Darstellung zuständig sein.

---

## Entscheidungshilfe

| Frage | Zielort |
|---|---|
| Wird HTML oder CSS beeinflusst? | Component / SCSS |
| Wird ein Formular validiert? | Component |
| Wird Supabase direkt abgefragt? | Repository |
| Wird ein Datenablauf koordiniert? | Service |
| Wird `snake_case` zu `camelCase` gewandelt? | Mapper |
| Wird `camelCase` zu `snake_case` gewandelt? | Payload-Mapper |
| Wird nur gerechnet oder gefiltert? | Utility |
| Brauchen mehrere Components denselben Datenstand? | Service |
| Ist es nur ein Dialog- oder Menüzustand? | Component |

---

## Häufige No-Gos

Nicht machen:

```text
Supabase direkt in Components verwenden
Datenbankfelder im Template nutzen
Dialoge alles selbst speichern lassen
Formularlogik in Services verschieben
UI-State global machen
Payload-Mapping mehrfach schreiben
große Methoden ohne Helper bauen
Debug-Code committen
Environment-Dateien mit echten Keys committen
```

---

## Zusammenfassung

Die Konventionen sollen den Code im Team einheitlich halten.

Components bleiben für UI und Benutzerinteraktion zuständig.  
Services koordinieren Datenlogik und gemeinsamen State.  
Repositories kapseln Supabase.  
Mapper übersetzen Datenformen.  
Utils enthalten reine Berechnungen.

Diese Trennung macht den Code leichter verständlich, leichter testbar und leichter zu reviewen.