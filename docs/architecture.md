# Services und Components

Dieses Dokument beschreibt, wie Services und Components im Join-Projekt zusammenarbeiten. Ziel ist eine klare Trennung zwischen UI, Geschäftslogik und Datenzugriff.

Components sollen anzeigen, reagieren und Benutzereingaben verarbeiten.  
Services sollen Daten laden, speichern, mappen und gemeinsamen State verwalten.

---

## Grundidee

Der Datenfluss läuft grundsätzlich von der Component zum Service.

```text
Component
  ↓
Service
  ↓
Repository oder SupabaseService
  ↓
Supabase
```

Beim Lesen kommen die Daten zurück:

```text
Supabase
  ↓
Repository
  ↓
Mapper
  ↓
Service-State
  ↓
Component
```

Dadurch bleibt die Component unabhängig von Datenbankdetails.

---

## Warum diese Trennung wichtig ist

Ohne klare Trennung würden Components schnell zu groß werden.

Eine Component müsste dann gleichzeitig:

```text
HTML anzeigen
Formulare verwalten
Datenbankabfragen ausführen
Payloads bauen
Daten mappen
Fehler behandeln
State aktualisieren
```

Das wäre schwer zu testen, schwer zu erweitern und im Team schwer nachvollziehbar.

Deshalb gilt:

```text
Component = Darstellung und Benutzerinteraktion
Service = Datenlogik und gemeinsamer State
Repository = direkter Datenbankzugriff
Mapper = Umwandlung zwischen Datenbank und App
Utils = reine Berechnungen
```

---

## Components

Components befinden sich unter:

```text
src/app/features/
src/app/layout/
src/app/shared/
```

Sie bilden sichtbare Bereiche der Anwendung ab.

Beispiele:

```text
contacts/page
contact-list
contact-detail
contact-create-dialog
contact-edit-dialog
contact-success-overlay
board
task-card
add-task
task-detail-dialog
sidebar
header
```

---

## Aufgabe einer Component

Eine Component ist zuständig für alles, was direkt mit Darstellung oder Benutzerinteraktion zu tun hat.

Dazu gehört:

- Template-Daten bereitstellen
- Inputs entgegennehmen
- Outputs auslösen
- Buttons und Klicks behandeln
- Dialoge öffnen und schließen
- Formulare aufbauen und validieren
- lokale UI-Zustände verwalten
- Lade- und Fehlerfeedback anzeigen
- CSS-Klassen über State steuern
- Daten an Child-Components weitergeben
- Events von Child-Components verarbeiten

Beispiele für UI-State:

```text
isCreateDialogOpen
isEditDialogOpen
isMobileActionMenuOpen
successMessage
searchTerm
selectedColumn
```

Diese Zustände gehören in die Component, weil sie nur die Darstellung betreffen.

---

## Was eine Component nicht machen soll

Eine Component soll keine Datenbanklogik enthalten.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Nicht in Components gehören:

- direkte Supabase-Abfragen
- Tabellennamen
- SQL-nahe Payloads
- Datenbankfelder wie `due_date` oder `sort_order`
- Mapping zwischen `snake_case` und `camelCase`
- Relationslogik für `task_assignments`
- komplexe Synchronisierung von Subtasks
- globale Datenhaltung, die mehrere Components betrifft

Stattdessen ruft eine Component eine Service-Methode auf.

Vorgesehen:

```typescript
private readonly taskService = inject(TaskService);
```

oder:

```typescript
private readonly contactService = inject(ContactService);
```

---

## Page-Components

Page-Components verbinden mehrere kleinere Components zu einem Feature.

Beispiele:

```text
Contacts Page
Board Page
Add Task Page
```

Eine Page-Component darf mehr koordinieren als eine kleine UI-Component.

Typische Aufgaben:

- Child-Components importieren
- Dialogzustände verwalten
- globale Feature-Aktionen starten
- Service-Methoden aufrufen
- Body-Scroll bei Dialogen sperren
- Erfolgsnachrichten anzeigen
- nach Schreiboperationen Daten aktualisieren

Beispiel aus dem Kontaktbereich:

```text
Contacts Page
  ↓
öffnet Create/Edit Dialoge
  ↓
ruft ContactService auf
  ↓
lädt ContactList neu
  ↓
zeigt Success Overlay
```

Die Page ist also die Koordinationsstelle für den Kontaktbereich.

---

## List-Components

List-Components zeigen Sammlungen von Daten an.

Beispiele:

```text
ContactList
TaskList
BoardColumn
```

Aufgaben:

- Datenliste anzeigen
- Einträge sortiert oder gruppiert darstellen
- Klick auf Eintrag behandeln
- Auswahl an Service oder Parent melden
- leere Zustände anzeigen
- Lade- oder Fehlermeldungen darstellen

Eine List-Component darf Daten aus einem Service-Signal lesen.

Beispiel:

```typescript
contacts = this.contactService.allContacts;
selectedContact = this.contactService.selectedContact;
```

Die Liste entscheidet aber nicht selbst, wie Daten dauerhaft gespeichert werden.

---

## Detail-Components

Detail-Components zeigen einen ausgewählten Datensatz an.

Beispiele:

```text
ContactDetail
TaskDetail
BoardCardsDialog
```

Aufgaben:

- ausgewählte Daten anzeigen
- Edit- oder Delete-Aktionen anbieten
- mobile Menüs verwalten
- Rücknavigation oder Close-Events auslösen
- Child-Events an Parent weitergeben

Detail-Components lesen häufig aus Service-State:

```typescript
contact = this.contactService.selectedContact;
```

oder:

```typescript
task = this.taskService.selectedTask;
subtasks = this.taskService.selectedSubtasks;
contacts = this.taskService.assignedContacts;
```

---

## Dialog-Components

Dialog-Components sind für Formulare oder Detailansichten in einem Overlay zuständig.

Beispiele:

```text
ContactCreateDialog
ContactEditDialog
AddTaskDialog
TaskDetailDialog
```

Dialoge sollen möglichst keine direkte Speicherlogik enthalten.

Sie sollen:

- Formular initialisieren
- Formular validieren
- Eingaben normalisieren
- Submit verhindern, wenn das Formular ungültig ist
- bei Cancel ein Event senden
- bei Submit ein fertiges Payload-Objekt senden

Beispiel:

```typescript
cancelled = output<void>();
submitted = output<CreateContact>();
```

Der Dialog speichert nicht selbst.  
Er sendet nur das Ergebnis an die Parent-Component.

---

## Warum Dialoge nicht selbst speichern sollten

Ein Dialog ist eine UI-Component.

Wenn ein Dialog direkt speichern würde, müsste er wissen:

```text
welcher Service verwendet wird
was nach erfolgreichem Speichern passiert
welcher Dialog geschlossen wird
welche Liste neu geladen wird
welche Erfolgsmeldung angezeigt wird
```

Das würde den Dialog zu stark an eine konkrete Seite koppeln.

Besser:

```text
Dialog
  ↓
submitted.emit(payload)
  ↓
Page-Component
  ↓
Service
  ↓
Datenbank
```

Dadurch bleibt der Dialog wiederverwendbarer und leichter verständlich.

---

## Feedback-Components

Feedback-Components zeigen nur Rückmeldungen an.

Beispiele:

```text
ContactSuccessOverlay
Toast
Loading State
Error Message
```

Sie bekommen Daten meist per Input.

Beispiel:

```typescript
message = input.required<string>();
```

Diese Components sollen keine Geschäftslogik enthalten.  
Sie zeigen nur an, was ihnen übergeben wird.

---

## Layout-Components

Layout-Components bilden die feste Struktur der Anwendung.

Beispiele:

```text
Header
Sidebar
Mobile Navigation
```

Aufgaben:

- Navigation anzeigen
- RouterLinks bereitstellen
- aktiven Menüpunkt markieren
- Grundlayout strukturieren

Layout-Components greifen normalerweise nicht auf Feature-Services zu.

---

## Services

Services befinden sich unter:

```text
src/app/core/services/
```

Sie enthalten wiederverwendbare Logik und gemeinsamen State.

Aktuell wichtig:

```text
ContactService
TaskService
SupabaseService
```

Der Service ist die Schicht, die Components verwenden sollen.

---

## Aufgabe eines Service

Ein Service ist zuständig für:

- Daten laden
- Daten erstellen
- Daten aktualisieren
- Daten löschen
- State über Signals bereitstellen
- Daten vor dem Speichern vorbereiten
- Daten nach dem Laden mappen
- mehrere Datenoperationen koordinieren
- Fehler an Components weitergeben
- gemeinsame Logik zentral halten

Ein Service darf also Geschäftslogik enthalten.

---

## Was ein Service nicht machen soll

Ein Service soll keine UI steuern.

Nicht in Services gehören:

- Dialoge öffnen
- CSS-Klassen setzen
- DOM direkt manipulieren
- FormControls verwalten
- Template-Logik enthalten
- Button-Texte setzen
- Animationen steuern
- responsive Layoutentscheidungen treffen

Diese Dinge bleiben in Components und SCSS.

---

## ContactService

Der `ContactService` verwaltet Kontakte.

Er hält gemeinsamen State:

```typescript
selectedContact
allContacts
```

Er stellt CRUD-Methoden bereit:

```typescript
getContacts()
getContactById()
createContact()
updateContact()
deleteContact()
```

Zusätzlich stellt er Hilfslogik bereit:

```typescript
getInitials()
```

und interne Methoden für:

```text
Mapping
Sortierung
State-Updates
Badge-Farbe
Payload-Erzeugung
```

---

## Aufgabe des ContactService

Der `ContactService` ist zuständig für:

- Kontakte aus Supabase laden
- Kontakte alphabetisch sortieren
- Kontakte erstellen
- Kontakte aktualisieren
- Kontakte löschen
- ausgewählten Kontakt verwalten
- Kontaktliste nach Änderungen aktuell halten
- Initialen erzeugen
- Badge-Farbe erzeugen
- Datenbankfelder in App-Models umwandeln

Dadurch müssen Contact-Components keine Supabase-Struktur kennen.

---

## ContactService-State

### `allContacts`

Enthält die aktuell bekannte Kontaktliste.

Wird aktualisiert nach:

```text
createContact()
updateContact()
deleteContact()
```

### `selectedContact`

Enthält den aktuell ausgewählten Kontakt.

Wird gesetzt, wenn:

```text
ein Kontakt in der Liste ausgewählt wird
ein Kontakt erstellt wurde
ein Kontakt aktualisiert wurde
```

Wird geleert, wenn:

```text
der ausgewählte Kontakt gelöscht wird
```

---

## Warum Kontakte im Service sortiert werden

Kontakte werden alphabetisch angezeigt.

Die Sortierung liegt im Service, damit alle Components dieselbe Reihenfolge verwenden.

Wenn jede Component selbst sortieren würde, könnten unterschiedliche Listenstände entstehen.

Der Service sorgt dafür:

```text
neuer Kontakt rein
→ Liste sortieren
→ State aktualisieren
```

Dasselbe gilt nach Updates.

---

## Warum `getInitials()` im Service liegt

Initialen werden an mehreren Stellen gebraucht:

```text
ContactList
ContactDetail
Dialoge
Task-Karten mit Kontaktbadges
```

Deshalb liegt die Funktion zentral im Service.

So bleibt die Darstellung konsistent.

---

## TaskService

Der `TaskService` verwaltet Tasks und ihre Beziehungen.

Er hält gemeinsamen State:

```typescript
allTasks
selectedTask
selectedSubtasks
assignedContacts
isLoading
errorMessage
```

Er koordiniert:

```text
Tasks
Subtasks
Kontaktzuweisungen
lokalen State
Fehlerzustände
```

Der `TaskService` ist komplexer als der `ContactService`, weil ein Task aus mehreren Tabellen zusammengesetzt wird.

---

## Aufgabe des TaskService

Der `TaskService` ist zuständig für:

- Tasks laden
- einzelne Tasks laden
- Subtasks eines Tasks laden
- zugewiesene Kontakte laden
- Board-Relationsdaten laden
- Tasks erstellen
- Tasks mit Subtasks und Kontakten erstellen
- Tasks aktualisieren
- Tasks mit Relationen aktualisieren
- Tasks löschen
- Subtasks erstellen, aktualisieren und löschen
- Kontaktzuweisungen erstellen und entfernen
- lokalen Signal-State aktualisieren
- Fehlerstatus setzen
- Cleanup bei fehlgeschlagenem Create-Flow
- State-Wiederherstellung bei fehlgeschlagenem Update

---

## Warum der TaskService Relationslogik enthält

Ein Task ist nicht nur eine Zeile in `tasks`.

Fachlich gehören dazu:

```text
Task-Daten
Subtasks
Kontaktzuweisungen
Kontaktdaten für die Anzeige
```

Diese Daten liegen getrennt in der Datenbank.

Deshalb muss der Service mehrere Repository-Aufrufe koordinieren.

Beispiel beim Erstellen:

```text
Task erstellen
  ↓
Task-ID erhalten
  ↓
Subtasks mit task_id erstellen
  ↓
Kontaktzuweisungen in task_assignments speichern
  ↓
State aktualisieren
```

Diese Reihenfolge gehört nicht in eine Component.

---

## SupabaseService

Der `SupabaseService` erstellt den Supabase Client.

Er liegt unter:

```text
src/app/core/supabase/supabase.ts
```

Er verwendet die zentrale Konfiguration:

```text
src/app/core/supabase/supabase.config.ts
```

Der Supabase Client soll nur von datenbanknahen Klassen verwendet werden.

Vorgesehen:

```text
Repository
datenbanknaher Service
```

Nicht vorgesehen:

```text
Feature-Component
Dialog-Component
List-Component
Detail-Component
```

---

## Service-State mit Signals

Services verwenden Signals, wenn Daten von mehreren Components genutzt werden.

Beispiele:

```typescript
allContacts = signal<Contact[]>([]);
selectedContact = signal<Contact | null>(null);

allTasks = signal<Task[]>([]);
selectedTask = signal<Task | null>(null);
```

Signals sind sinnvoll für:

```text
gemeinsame Daten
ausgewählte Datensätze
Ladezustände
Fehlermeldungen
```

Components können diese Signals direkt lesen.

Beispiel:

```typescript
readonly contacts = this.contactService.allContacts;
```

Im Template:

```html
@for (contact of contacts(); track contact.id) {
  <!-- contact item -->
}
```

---

## Lokaler Component-State

Nicht jeder State gehört in einen Service.

State gehört in die Component, wenn er nur für diese Darstellung wichtig ist.

Beispiele:

```text
isCreateDialogOpen
isEditDialogOpen
isMobileActionMenuOpen
isMobileActionMenuClosing
successMessage
searchTerm
form
```

Dieser State beschreibt nicht die Daten der Anwendung, sondern nur den aktuellen UI-Zustand.

---

## Wann State in den Service gehört

State gehört in den Service, wenn:

```text
mehrere Components denselben Stand brauchen
der Stand nach CRUD-Operationen aktuell bleiben muss
es sich um geladene Daten handelt
eine Auswahl featureweit relevant ist
```

Beispiele:

```text
allContacts
selectedContact
allTasks
selectedTask
selectedSubtasks
assignedContacts
```

---

## Wann State in die Component gehört

State gehört in die Component, wenn:

```text
nur diese Component ihn braucht
er nur die Anzeige steuert
er beim Schließen der Component verschwinden kann
er nicht dauerhaft geteilt werden muss
```

Beispiele:

```text
Dialog geöffnet oder geschlossen
mobile Menüanimation
Formularzustand
Hover- oder Toggle-Zustand
temporäre Erfolgsmeldung
```

---

## Kommunikation zwischen Parent und Child

Child-Components sollen nicht unnötig globale Services verändern, wenn ein Event auch an die Parent-Component gehen kann.

Typischer Ablauf:

```text
Child
  ↓
output()
  ↓
Parent
  ↓
Service
```

Beispiel:

```typescript
submitted = output<CreateContact>();
cancelled = output<void>();
```

Die Parent-Component entscheidet dann:

```text
Dialog schließen
Service aufrufen
Liste neu laden
Erfolgsmeldung anzeigen
```

---

## Inputs

Inputs werden genutzt, wenn eine Child-Component Daten anzeigen oder bearbeiten soll.

Beispiel:

```typescript
contact = input.required<Contact>();
```

Die Child-Component muss dadurch nicht selbst wissen, woher der Kontakt kommt.

---

## Outputs

Outputs werden genutzt, wenn eine Child-Component eine Aktion melden soll.

Beispiele:

```typescript
submitted = output<CreateContact>();
cancelled = output<void>();
editContactRequested = output<Contact>();
backRequested = output<void>();
```

Outputs halten Child-Components unabhängig.

Die Child-Component sagt nur:

```text
User hat gespeichert.
User hat abgebrochen.
User möchte bearbeiten.
User möchte zurück.
```

Die Parent-Component entscheidet, was danach passiert.

---

## Beispiel: Kontakt erstellen

Ablauf:

```text
ContactCreateDialog
  ↓
submitted.emit(CreateContact)
  ↓
Contacts Page
  ↓
ContactService.createContact()
  ↓
ContactService aktualisiert allContacts und selectedContact
  ↓
Contacts Page schließt Dialog und zeigt Erfolgsmeldung
```

Der Dialog kennt Supabase nicht.  
Die Page koordiniert.  
Der Service speichert und aktualisiert den State.

---

## Beispiel: Kontakt auswählen

Ablauf:

```text
ContactList
  ↓
User klickt Kontakt
  ↓
ContactService.selectedContact.set(contact)
  ↓
ContactDetail liest selectedContact
```

Dadurch muss die Detail-Component nicht direkt mit der Liste verbunden sein.

Beide Components teilen den Zustand über den Service.

---

## Beispiel: Task erstellen

Ablauf:

```text
AddTask Component
  ↓
CreateTaskWithRelationsInput erzeugen
  ↓
TaskService.createTaskWithRelations()
  ↓
TaskRepository.createTask()
  ↓
Subtasks speichern
  ↓
Kontaktzuweisungen speichern
  ↓
Service-State aktualisieren
```

Die Component erzeugt nur das Input-Objekt.  
Der Service kennt die Reihenfolge der Datenbankoperationen.

---

## Beispiel: Task im Board verschieben

Drag-and-drop bleibt in der Board-Component.

Die Component entscheidet:

```text
neue Spalte
neuer Index
lokale Reihenfolge
```

Gespeichert wird über den Service:

```typescript
await this.taskService.updateTask(task.id, {
  status: targetStatus,
  sortOrder: targetIndex,
});
```

Der Service speichert nur den neuen Status und die neue Reihenfolge.

---

## Fehlerbehandlung

Services werfen Fehler weiter.

Die Component fängt Fehler ab und entscheidet über UI-Feedback.

Beispiel:

```typescript
try {
  await this.taskService.getTasks();
} catch (error) {
  console.error('Tasks could not be loaded.', error);
}
```

Der Service kann zusätzlich ein Fehler-Signal setzen:

```typescript
errorMessage.set('Tasks could not be loaded.');
```

Die Component kann dieses Signal anzeigen.

---

## Ladezustand

Services können einen gemeinsamen Ladezustand bereitstellen.

Beispiel:

```typescript
isLoading
```

Components nutzen diesen Zustand für:

```text
Buttons deaktivieren
Loader anzeigen
Doppel-Submits verhindern
```

Beispiel:

```html
<button
  type="submit"
  [disabled]="isLoading()"
>
  Create Task
</button>
```

---

## Formulare

Formulare gehören in Components.

Die Component ist zuständig für:

- FormGroup
- FormControls
- Validatoren
- Fehlermeldungen im Template
- Markieren ungültiger Felder
- Erzeugen des Create- oder Update-Inputs

Der Service bekommt nur ein fertiges Payload-Objekt.

Beispiel:

```typescript
if (this.form.invalid) {
  this.form.markAllAsTouched();
  return;
}

await this.taskService.createTaskWithRelations(
  this.createTaskInput(),
);
```

---

## Payloads

Eine Component erzeugt ein fachliches Input-Objekt.

Beispiel:

```typescript
{
  task: {
    title: 'Task title',
    dueDate: '2026-07-23',
    category: 'technical_task',
    priority: 'medium',
  },
  subtasks: [
    {
      title: 'First subtask',
      sortOrder: 0,
    },
  ],
  contactIds: [
    'contact-id-1',
    'contact-id-2',
  ],
}
```

Die Component erzeugt keine Supabase-Payloads mit `snake_case`.

Nicht in Components:

```typescript
{
  due_date: '2026-07-23',
  sort_order: 0,
}
```

Das übernimmt der Payload-Mapper im Core-Bereich.

---

## Direkte Datenbankfelder vermeiden

In Components werden Application-Models verwendet.

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

## Services und Tests

Services lassen sich besser testen, wenn sie klare Zuständigkeiten haben.

Gut testbar sind:

```text
Service-Methoden mit klaren Inputs und Outputs
Mapper
Payload-Mapper
Utils
State-Updates
Fehlerfälle
```

Components sollten dagegen eher über User-Flows getestet werden:

```text
Formular ausfüllen
Button klicken
Dialog öffnet
Fehlermeldung erscheint
Erfolgsmeldung erscheint
```

---

## Namensregeln

Services:

```text
contact.service.ts
task.service.ts
```

Components:

```text
contact-list.ts
contact-detail.ts
contact-create-dialog.ts
board.ts
task-card.ts
```

Models:

```text
contact.model.ts
task.model.ts
subtask.model.ts
task-assignment.model.ts
```

Mapper:

```text
task.mapper.ts
task-payload.mapper.ts
```

Utils:

```text
task-state.utils.ts
task-filter.utils.ts
subtask-progress.utils.ts
```

Dateinamen sollen beschreiben, wofür die Datei verantwortlich ist.

---

## Entscheidungshilfe

Wenn neue Logik entsteht, hilft diese Einordnung:

| Frage | Zielort |
|---|---|
| Betrifft es HTML, Klicks, Dialoge oder Formularzustand? | Component |
| Wird Supabase direkt abgefragt? | Repository |
| Wird ein Datenablauf koordiniert? | Service |
| Wird `snake_case` zu `camelCase` umgewandelt? | Mapper |
| Wird Angular-Datenform zu Supabase-Payload? | Payload-Mapper |
| Ist es eine reine Berechnung ohne Seiteneffekt? | Utility |
| Wird global geteilter Feature-State gebraucht? | Service |
| Betrifft es nur eine sichtbare UI-Situation? | Component |

---

## Häufige Fehler vermeiden

### Supabase nicht in Components injizieren

Falsch:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Richtig:

```typescript
private readonly contactService = inject(ContactService);
```

oder:

```typescript
private readonly taskService = inject(TaskService);
```

---

### Dialoge nicht direkt speichern lassen

Falsch:

```text
Dialog ruft Supabase oder Repository direkt auf.
```

Richtig:

```text
Dialog emittet Payload.
Parent ruft Service auf.
Service speichert.
```

---

### Service nicht mit UI-State überladen

Nicht in den Service:

```text
isDialogOpen
isMobileMenuOpen
hoveredItem
form
```

In den Service:

```text
allTasks
selectedTask
allContacts
selectedContact
isLoading
errorMessage
```

---

### Keine Datenbank-Payloads in Components bauen

Falsch:

```typescript
{
  due_date: this.form.controls.dueDate.value,
  sort_order: index,
}
```

Richtig:

```typescript
{
  dueDate: this.form.controls.dueDate.value,
  sortOrder: index,
}
```

---

### Keine Logik doppelt schreiben

Wenn Logik an mehreren Stellen gebraucht wird, sollte sie ausgelagert werden.

Beispiele:

```text
Initialen berechnen
Tasks sortieren
Subtasks sortieren
Fortschritt berechnen
IDs vergleichen
Payloads bauen
```

---

## Zusammenfassung

Services und Components haben getrennte Aufgaben.

Components zeigen Daten an, verwalten Formulare und reagieren auf Benutzeraktionen.  
Services laden, speichern und verwalten gemeinsamen State.  
Repositories sprechen direkt mit Supabase.  
Mapper und Payload-Mapper übersetzen zwischen Datenbank und Angular.  
Utils enthalten reine Berechnungen.

Diese Trennung hält das Projekt verständlich, reduziert doppelte Logik und macht Änderungen für das Team leichter nachvollziehbar.