# TaskService-Integration

Dieses Dokument ist der Implementierungsleitfaden für alle Components, die Tasks, Subtasks oder Kontaktzuweisungen verwenden.

Es zeigt:

- wie der Service importiert wird
- wie Signals verwendet werden
- wie Tasks geladen werden
- wie Board-Daten aufgebaut werden
- wie Add Task angebunden wird
- wie Edit Task angebunden wird
- wie Drag-and-drop persistiert wird
- wie Suche und Fortschritt integriert werden
- wie Fehler und Ladezustände behandelt werden

---

## Grundregel

Components verwenden:

```text
TaskService
```

Components verwenden nicht direkt:

```text
TaskRepository
SupabaseService
TaskRow
SubtaskRow
snake_case-Datenbankfelder
```

---

## Importpfade

Der genaue relative Pfad hängt vom Speicherort der Component ab.

Beispiel für:

```text
src/app/features/board/pages/board/board.ts
```

```typescript
import { TaskService } from '../../../../core/services/task.service';
```

Beispiel für:

```text
src/app/features/tasks/pages/add-task/add-task.ts
```

```typescript
import { TaskService } from '../../../../core/services/task.service';
```

Bei einer anderen Verzeichnistiefe muss der relative Pfad angepasst werden.

---

## Service injizieren

```typescript
import { Component, inject } from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-board',
  imports: [],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  private readonly taskService = inject(TaskService);
}
```

Soll das Template direkt auf Service-Signals zugreifen:

```typescript
readonly taskService = inject(TaskService);
```

Oder über lokale Referenzen:

```typescript
private readonly taskService = inject(TaskService);

readonly tasks = this.taskService.allTasks;
readonly selectedTask = this.taskService.selectedTask;
readonly selectedSubtasks = this.taskService.selectedSubtasks;
readonly assignedContacts = this.taskService.assignedContacts;
readonly isLoading = this.taskService.isLoading;
readonly errorMessage = this.taskService.errorMessage;
```

---

## Signals im Template verwenden

```html
@if (isLoading()) {
  <p>Tasks are loading...</p>
}

@if (errorMessage()) {
  <p class="error-message">
    {{ errorMessage() }}
  </p>
}

@for (task of tasks(); track task.id) {
  <app-task-card [task]="task" />
}
```

Signals werden als Funktionen gelesen:

```typescript
tasks()
isLoading()
errorMessage()
```

---

## Board-Tasks laden

```typescript
import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-board',
  imports: [],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private readonly taskService = inject(TaskService);

  readonly tasks = this.taskService.allTasks;
  readonly isLoading = this.taskService.isLoading;
  readonly errorMessage = this.taskService.errorMessage;

  async ngOnInit(): Promise<void> {
    await this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    try {
      await this.taskService.getTasks();
    } catch (error) {
      console.error('Tasks could not be loaded.', error);
    }
  }
}
```

---

## Tasks nach Status gruppieren

```typescript
import { computed } from '@angular/core';
import {
  filterTasksByStatus,
} from '../../../../core/utils/task-filter.utils';
```

```typescript
readonly todoTasks = computed(() => {
  return filterTasksByStatus(
    this.taskService.allTasks(),
    'todo',
  );
});

readonly inProgressTasks = computed(() => {
  return filterTasksByStatus(
    this.taskService.allTasks(),
    'in_progress',
  );
});

readonly awaitingFeedbackTasks = computed(() => {
  return filterTasksByStatus(
    this.taskService.allTasks(),
    'awaiting_feedback',
  );
});

readonly doneTasks = computed(() => {
  return filterTasksByStatus(
    this.taskService.allTasks(),
    'done',
  );
});
```

Template:

```html
<app-board-column
  title="To do"
  [tasks]="todoTasks()"
/>

<app-board-column
  title="In progress"
  [tasks]="inProgressTasks()"
/>

<app-board-column
  title="Await feedback"
  [tasks]="awaitingFeedbackTasks()"
/>

<app-board-column
  title="Done"
  [tasks]="doneTasks()"
/>
```

---

## Suche integrieren

```typescript
import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  filterTasksBySearchTerm,
  filterTasksByStatus,
} from '../../../../core/utils/task-filter.utils';
```

```typescript
readonly searchTerm = signal('');

readonly searchedTasks = computed(() => {
  return filterTasksBySearchTerm(
    this.taskService.allTasks(),
    this.searchTerm(),
  );
});

readonly todoTasks = computed(() => {
  return filterTasksByStatus(
    this.searchedTasks(),
    'todo',
  );
});
```

Input-Handler:

```typescript
updateSearchTerm(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.searchTerm.set(input.value);
}
```

Template:

```html
<input
  type="search"
  placeholder="Find Task"
  [value]="searchTerm()"
  (input)="updateSearchTerm($event)"
/>
```

---

## Task-Details öffnen

Zuerst wird der Task gesetzt. Danach werden Subtasks und Kontakte geladen.

```typescript
async openTask(taskId: string): Promise<void> {
  try {
    const task = await this.taskService.getTaskById(taskId);

    if (!task) {
      return;
    }

    await Promise.all([
      this.taskService.getSubtasksByTaskId(taskId),
      this.taskService.getAssignedContacts(taskId),
    ]);

    this.isTaskDialogOpen.set(true);
  } catch (error) {
    console.error('Task details could not be loaded.', error);
  }
}
```

Danach stehen zur Verfügung:

```typescript
this.taskService.selectedTask()
this.taskService.selectedSubtasks()
this.taskService.assignedContacts()
```

---

## Detaildialog mit Signals verbinden

```typescript
readonly selectedTask = this.taskService.selectedTask;
readonly selectedSubtasks = this.taskService.selectedSubtasks;
readonly assignedContacts = this.taskService.assignedContacts;
```

```html
@if (isTaskDialogOpen() && selectedTask(); as task) {
  <app-task-detail-dialog
    [task]="task"
    [subtasks]="selectedSubtasks()"
    [assignedContacts]="assignedContacts()"
    (closed)="closeTaskDialog()"
    (deleted)="deleteTask(task.id)"
  />
}
```

---

## Einfachen Task erstellen

Diese Methode nur verwenden, wenn keine Subtasks und keine Kontakte zusammen gespeichert werden sollen.

```typescript
await this.taskService.createTask({
  title: 'Create board layout',
  description: 'Implement the board columns.',
  dueDate: '2026-07-30',
  priority: 'medium',
  category: 'technical_task',
});
```

Für das vollständige Add-Task-Formular ist normalerweise `createTaskWithRelations()` vorgesehen.

---

## Add-Task-Formular vorbereiten

```typescript
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
```

```typescript
readonly taskForm = new FormGroup({
  title: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  }),
  description: new FormControl('', {
    nonNullable: true,
  }),
  dueDate: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  }),
  priority: new FormControl<'urgent' | 'medium' | 'low'>(
    'medium',
    {
      nonNullable: true,
    },
  ),
  category: new FormControl<
    'technical_task' | 'user_story' | ''
  >('', {
    nonNullable: true,
    validators: [Validators.required],
  }),
});
```

Zusätzliche States:

```typescript
readonly subtaskInputs = signal<CreateTaskSubtaskInput[]>([]);
readonly selectedContactIds = signal<string[]>([]);
readonly isSaving = signal(false);
readonly saveError = signal('');
```

Imports:

```typescript
import {
  CreateTaskSubtaskInput,
  CreateTaskWithRelationsInput,
} from '../../../../core/models/task-persistence.model';
```

---

## Vergangenes Fälligkeitsdatum verhindern

```typescript
getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
```

Template:

```html
<input
  type="date"
  formControlName="dueDate"
  [min]="getTodayDate()"
/>
```

Zusätzliche Prüfung:

```typescript
isDueDateInPast(dueDate: string): boolean {
  const today = this.getTodayDate();
  return dueDate < today;
}
```

---

## Subtask im Add-Task-Formular hinzufügen

```typescript
addSubtask(event?: Event): void {
  event?.preventDefault();

  const title = this.subtaskControl.value.trim();

  if (!title) {
    return;
  }

  this.subtaskInputs.update((subtasks) => [
    ...subtasks,
    {
      title,
      sortOrder: subtasks.length,
    },
  ]);

  this.subtaskControl.setValue('');
}
```

Template:

```html
<input
  type="text"
  [formControl]="subtaskControl"
  (keydown.enter)="addSubtask($event)"
/>

<button
  type="button"
  (click)="addSubtask()"
>
  Add subtask
</button>
```

`type="button"` verhindert das Absenden des Hauptformulars.

---

## Task mit Relationsdaten erstellen

```typescript
private createTaskPayload(): CreateTaskWithRelationsInput {
  const formValue = this.taskForm.getRawValue();

  if (!formValue.category) {
    throw new Error('Task category is required.');
  }

  return {
    task: {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
      status: 'todo',
      sortOrder: 0,
    },
    subtasks: this.subtaskInputs(),
    contactIds: this.selectedContactIds(),
  };
}
```

Speichern:

```typescript
async saveTask(): Promise<void> {
  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }

  const dueDate = this.taskForm.controls.dueDate.value;

  if (this.isDueDateInPast(dueDate)) {
    this.saveError.set(
      'The due date must not be in the past.',
    );

    return;
  }

  this.isSaving.set(true);
  this.saveError.set('');

  try {
    await this.taskService.createTaskWithRelations(
      this.createTaskPayload(),
    );

    this.resetTaskForm();
  } catch (error) {
    console.error('Task could not be created.', error);
    this.saveError.set(
      this.taskService.errorMessage(),
    );
  } finally {
    this.isSaving.set(false);
  }
}
```

Template:

```html
<button
  type="submit"
  [disabled]="taskForm.invalid || isSaving()"
>
  @if (isSaving()) {
    Creating task...
  } @else {
    Create task
  }
</button>
```

---

## Kontakte auswählen

```typescript
private readonly contactService = inject(ContactService);

readonly contacts = this.contactService.allContacts;
readonly selectedContactIds = signal<string[]>([]);
```

Kontakte laden:

```typescript
async loadContacts(): Promise<void> {
  try {
    const contacts = await this.contactService.getContacts();
    this.contactService.allContacts.set(contacts);
  } catch (error) {
    console.error('Contacts could not be loaded.', error);
  }
}
```

Auswahl umschalten:

```typescript
toggleContact(contactId: string): void {
  this.selectedContactIds.update((ids) => {
    return ids.includes(contactId)
      ? ids.filter((id) => id !== contactId)
      : [...ids, contactId];
  });
}
```

Prüfen:

```typescript
isContactSelected(contactId: string): boolean {
  return this.selectedContactIds().includes(contactId);
}
```

---

## Task bearbeiten

Nur einzelne Task-Felder aktualisieren:

```typescript
await this.taskService.updateTask(task.id, {
  title: 'Updated task title',
  priority: 'urgent',
});
```

Diese Methode eignet sich für:

- Statusänderung
- Positionsänderung
- Prioritätsänderung
- einzelne Detailänderungen ohne Relations-Synchronisierung

---

## Task inklusive Relationen bearbeiten

```typescript
await this.taskService.updateTaskWithRelations(
  task.id,
  {
    task: {
      title: formValue.title,
      description: formValue.description,
      dueDate: formValue.dueDate,
      priority: formValue.priority,
      category: formValue.category,
    },
    subtasks: editedSubtasks,
    contactIds: selectedContactIds,
  },
);
```

---

## Bestehende und neue Subtasks im Edit-Formular

Bestehender Subtask:

```typescript
{
  id: subtask.id,
  title: subtask.title,
  isCompleted: subtask.isCompleted,
  sortOrder: index,
}
```

Neuer Subtask:

```typescript
{
  title: 'New subtask',
  isCompleted: false,
  sortOrder: index,
}
```

Nicht mehr im Array enthaltene bestehende Subtasks werden gelöscht.

---

## Relationsdaten unverändert lassen

```typescript
await this.taskService.updateTaskWithRelations(
  task.id,
  {
    task: {
      title: 'Updated title',
    },
  },
);
```

Da `subtasks` und `contactIds` nicht übergeben werden, bleiben sie unverändert.

---

## Alle Relationsdaten entfernen

```typescript
await this.taskService.updateTaskWithRelations(
  task.id,
  {
    task: {},
    subtasks: [],
    contactIds: [],
  },
);
```

Bedeutung:

- alle Subtasks löschen
- alle Kontaktzuweisungen löschen

---

## Subtask abschließen oder öffnen

```typescript
async toggleSubtask(subtask: Subtask): Promise<void> {
  try {
    await this.taskService.toggleSubtaskCompletion(
      subtask.id,
      !subtask.isCompleted,
    );
  } catch (error) {
    console.error('Subtask could not be updated.', error);
  }
}
```

---

## Einzelnen Subtask löschen

```typescript
async deleteSubtask(subtaskId: string): Promise<void> {
  try {
    await this.taskService.deleteSubtask(subtaskId);
  } catch (error) {
    console.error('Subtask could not be deleted.', error);
  }
}
```

---

## Gesamte Subtask-Liste synchronisieren

```typescript
await this.taskService.replaceTaskSubtasks(
  task.id,
  editedSubtasks,
);
```

Wird bereits `updateTaskWithRelations()` verwendet, ist kein zusätzlicher Aufruf notwendig.

---

## Kontaktzuweisungen bearbeiten

Einzelnen Kontakt hinzufügen:

```typescript
await this.taskService.assignContact(
  task.id,
  contact.id,
);
```

Zuweisung entfernen:

```typescript
await this.taskService.removeContactAssignment(
  task.id,
  contact.id,
);
```

Gesamte Auswahl synchronisieren:

```typescript
await this.taskService.replaceTaskAssignments(
  task.id,
  selectedContactIds,
);
```

Wird `updateTaskWithRelations()` verwendet, ist kein separater Assignment-Aufruf notwendig.

---

## Task löschen

```typescript
async deleteTask(taskId: string): Promise<void> {
  try {
    await this.taskService.deleteTask(taskId);
    this.closeTaskDialog();
  } catch (error) {
    console.error('Task could not be deleted.', error);
  }
}
```

Durch `ON DELETE CASCADE` werden ebenfalls gelöscht:

- Subtasks
- Kontaktzuweisungen

---

## Relationsdaten für Board-Karten laden

Der `TaskService` hält die Relationsdaten des aktuell ausgewählten Tasks in globalen Signals.

Für alle Board-Karten können lokale Maps verwendet werden.

```typescript
readonly subtasksByTaskId =
  signal<Record<string, Subtask[]>>({});

readonly contactsByTaskId =
  signal<Record<string, Contact[]>>({});
```

```typescript
async loadBoardData(): Promise<void> {
  try {
    const tasks = await this.taskService.getTasks();
    await this.loadTaskRelations(tasks);
  } catch (error) {
    console.error('Board data could not be loaded.', error);
  }
}
```

```typescript
private async loadTaskRelations(
  tasks: Task[],
): Promise<void> {
  const relationEntries = await Promise.all(
    tasks.map(async (task) => {
      const [subtasks, contacts] = await Promise.all([
        this.taskService.getSubtasksByTaskId(task.id),
        this.taskService.getAssignedContacts(task.id),
      ]);

      return {
        taskId: task.id,
        subtasks,
        contacts,
      };
    }),
  );

  this.subtasksByTaskId.set(
    Object.fromEntries(
      relationEntries.map((entry) => [
        entry.taskId,
        entry.subtasks,
      ]),
    ),
  );

  this.contactsByTaskId.set(
    Object.fromEntries(
      relationEntries.map((entry) => [
        entry.taskId,
        entry.contacts,
      ]),
    ),
  );
}
```

Diese Lösung erzeugt mehrere Supabase-Abfragen. Für den aktuellen Sprint ist sie verwendbar. Bei größeren Datenmengen sollte später eine zusammengefasste Repository-Abfrage ergänzt werden.

---

## Fortschritt einer Task-Karte

```typescript
import {
  calculateSubtaskProgress,
} from '../../../../core/utils/subtask-progress.utils';
```

```typescript
getTaskProgress(taskId: string): SubtaskProgress {
  const subtasks =
    this.subtasksByTaskId()[taskId] ?? [];

  return calculateSubtaskProgress(subtasks);
}
```

Template:

```html
@let progress = getTaskProgress(task.id);

@if (progress.total > 0) {
  <div class="task-card__progress">
    <div class="task-card__progress-track">
      <div
        class="task-card__progress-value"
        [style.width.%]="progress.percentage"
      ></div>
    </div>

    <span>
      {{ progress.completed }}/{{ progress.total }}
      Subtasks
    </span>
  </div>
}
```

---

## Drag-and-drop persistieren

Die Drag-and-drop-Logik bleibt in der Board-Component.

Einzelnen Task aktualisieren:

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

Mehrere Tasks einer Spalte persistieren:

```typescript
async persistColumnOrder(
  tasks: Task[],
  status: TaskStatus,
): Promise<void> {
  await Promise.all(
    tasks.map((task, index) => {
      return this.taskService.updateTask(task.id, {
        status,
        sortOrder: index,
      });
    }),
  );
}
```

Beim Wechsel zwischen zwei Spalten sollten Quell- und Zielspalte neu indexiert werden:

```typescript
await Promise.all([
  this.persistColumnOrder(sourceTasks, sourceStatus),
  this.persistColumnOrder(targetTasks, targetStatus),
]);
```

Bei einem Fehler:

```typescript
try {
  await this.persistBoardMovement();
} catch (error) {
  await this.taskService.getTasks();
  this.showErrorMessage();
}
```

---

## Ladezustände

Der Service besitzt:

```typescript
isLoading
errorMessage
```

Für komplexe Components kann zusätzlich ein lokaler Ladezustand verwendet werden:

```typescript
readonly isSaving = signal(false);
```

---

## Fehlerbehandlung

```typescript
async saveTask(): Promise<void> {
  try {
    await this.taskService.createTaskWithRelations(
      this.createTaskPayload(),
    );
  } catch (error) {
    console.error('Task could not be saved.', error);
  }
}
```

Service-Fehlermeldung:

```typescript
readonly errorMessage =
  this.taskService.errorMessage;
```

```html
@if (errorMessage()) {
  <p class="error-message">
    {{ errorMessage() }}
  </p>
}
```

---

## Erfolgsfeedback

Der Service verwaltet kein visuelles Success-Overlay.

```typescript
readonly successMessage = signal('');
```

```typescript
private showSuccess(message: string): void {
  this.successMessage.set(message);

  setTimeout(() => {
    this.successMessage.set('');
  }, 2500);
}
```

---

## Integrationscheckliste

### Board

- [ ] `TaskService` injiziert
- [ ] Tasks in `ngOnInit` geladen
- [ ] Tasks nach Status gefiltert
- [ ] leere Spalten zeigen einen Hinweis
- [ ] Suche verwendet Filter-Utility
- [ ] Task-Klick lädt zuerst den Task und danach Relationsdaten
- [ ] Drag-and-drop verwendet `updateTask`
- [ ] Quell- und Zielspalte werden neu indexiert
- [ ] Fehler setzen die Board-Daten zurück

### Add Task

- [ ] Reactive Form verwendet
- [ ] Titel erforderlich
- [ ] Datum erforderlich
- [ ] Datum nicht in der Vergangenheit
- [ ] Kategorie erforderlich
- [ ] Standardpriorität `medium`
- [ ] Subtask-Enter erstellt nicht den Haupttask
- [ ] Kontakte können ausgewählt werden
- [ ] `createTaskWithRelations()` verwendet
- [ ] Submit während Speicherung deaktiviert
- [ ] Erfolg und Fehler werden angezeigt

### Task Detail und Edit

- [ ] `getTaskById()` zuerst ausgeführt
- [ ] Subtasks und Kontakte danach geladen
- [ ] bestehende Subtasks behalten ihre ID
- [ ] neue Subtasks besitzen keine ID
- [ ] `updateTaskWithRelations()` verwendet
- [ ] `undefined` und `[]` korrekt unterschieden
- [ ] Löschen verwendet `deleteTask()`
- [ ] Dialog wird nach Erfolg geschlossen