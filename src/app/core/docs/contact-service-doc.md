# ContactService – Dokumentation und Integrationsleitfaden

Diese Dokumentation beschreibt die Kontakt-Datenebene des Join-Projekts und zeigt, wie der `ContactService` in Angular-Komponenten eingebunden wird.

Dokumentiert werden:

* Contact-Models
* Supabase-Datenstruktur
* öffentliche Signals und Methoden
* Laden und Auswählen von Kontakten
* Erstellen, Bearbeiten und Löschen
* Integration in Formulare und Dialoge
* Verwendung in Add-Task-Komponenten
* Fehler- und Ladezustände
* Testfälle und bekannte Verhaltensweisen

---

## Relevante Dateien

```text
src/app/core/models/contact.model.ts
src/app/core/services/contact.service.ts
src/app/core/supabase/supabase.ts

src/app/features/contacts/components/contact-list/
src/app/features/contacts/components/contact-detail/
src/app/features/contacts/components/contact-create-dialog/
src/app/features/contacts/components/contact-edit-dialog/
src/app/features/contacts/components/contact-success-overlay/
src/app/features/contacts/pages/contacts/
```

---

## Architektur

Der Kontaktbereich verwendet aktuell diesen Datenfluss:

```text
Angular Component
        ↓
ContactService
        ↓
SupabaseService
        ↓
Supabase contacts table
```

Beim Lesen werden Supabase-Daten in Angular-Models umgewandelt:

```text
Supabase ContactRow
        ↓
ContactService Mapper
        ↓
Angular Contact
        ↓
Component oder Signal
```

Komponenten greifen nicht direkt auf Supabase zu.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly contactService = inject(ContactService);
```

---

# Contact-Models

Datei:

```text
src/app/core/models/contact.model.ts
```

## `ContactRow`

`ContactRow` repräsentiert die Datenbankstruktur und verwendet `snake_case`.

```typescript
export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  badge_color: string;
  created_at: string;
  updated_at: string;
}
```

Dieser Typ wird hauptsächlich intern im `ContactService` verwendet.

Components sollten nicht mit `ContactRow` arbeiten.

---

## `Contact`

`Contact` ist das Model für Angular-Komponenten und verwendet `camelCase`.

```typescript
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  badgeColor: string;
  createdAt: string;
  updatedAt: string;
}
```

Beispiel:

```typescript
const contact: Contact = {
  id: 'contact-uuid',
  firstName: 'Anna',
  lastName: 'Schmidt',
  email: 'anna.schmidt@example.com',
  phone: '+49 123456789',
  badgeColor: 'hsl(180 70% 42%)',
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:00:00.000Z',
};
```

---

## `CreateContact`

`CreateContact` wird beim Anlegen eines neuen Kontakts verwendet.

```typescript
export interface CreateContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}
```

Die folgenden Werte werden nicht von der Component übergeben:

* `id`
* `badgeColor`
* `createdAt`
* `updatedAt`

Die ID und Zeitstempel werden von Supabase erzeugt.

Die Badge-Farbe wird vom `ContactService` generiert.

---

## `UpdateContact`

`UpdateContact` wird beim Bearbeiten verwendet.

```typescript
export interface UpdateContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
}
```

Alle Felder sind optional. Dadurch können einzelne Eigenschaften aktualisiert werden.

Beispiel:

```typescript
await this.contactService.updateContact(contact.id, {
  email: 'new.email@example.com',
});
```

Vorname, Nachname und Telefonnummer bleiben dabei unverändert.

---

# Supabase-Tabelle `contacts`

Der Service verwendet die Tabelle:

```text
public.contacts
```

## Verwendete Spalten

| Datenbankfeld | Angular-Feld | Beschreibung                 |
| ------------- | ------------ | ---------------------------- |
| `id`          | `id`         | UUID des Kontakts            |
| `first_name`  | `firstName`  | Vorname                      |
| `last_name`   | `lastName`   | Nachname                     |
| `email`       | `email`      | E-Mail-Adresse               |
| `phone`       | `phone`      | Telefonnummer oder `null`    |
| `badge_color` | `badgeColor` | Hintergrundfarbe des Avatars |
| `created_at`  | `createdAt`  | Erstellungszeitpunkt         |
| `updated_at`  | `updatedAt`  | Änderungszeitpunkt           |

---

# ContactService einbinden

## Import

Der relative Pfad hängt vom Speicherort der Component ab.

Beispiel für eine Contact-Component:

```typescript
import { ContactService } from '../../../../core/services/contact.service';
```

Beispiel für eine Task-Component:

```typescript
import { ContactService } from '../../../../core/services/contact.service';
```

Die Anzahl der `../`-Segmente muss an die tatsächliche Verzeichnistiefe angepasst werden.

---

## Service injizieren

Empfohlene Variante:

```typescript
import { Component, inject } from '@angular/core';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-example',
  imports: [],
  templateUrl: './example.html',
  styleUrl: './example.scss',
})
export class Example {
  private readonly contactService = inject(ContactService);
}
```

Soll das Template direkt auf die Signals zugreifen:

```typescript
readonly contactService = inject(ContactService);
```

Alternativ können lokale Referenzen angelegt werden:

```typescript
private readonly contactService = inject(ContactService);

readonly contacts = this.contactService.allContacts;
readonly selectedContact = this.contactService.selectedContact;
```

---

# Öffentliche Signals

Der Service stellt zwei Signals bereit.

## `allContacts`

```typescript
allContacts = signal<Contact[]>([]);
```

Enthält die aktuell im Frontend gespeicherten Kontakte.

Verwendung:

```typescript
readonly contacts = this.contactService.allContacts;
```

Im Template:

```html
@for (contact of contacts(); track contact.id) {
  <div>
    {{ contact.firstName }}
    {{ contact.lastName }}
  </div>
}
```

---

## `selectedContact`

```typescript
selectedContact = signal<Contact | null>(null);
```

Enthält den aktuell ausgewählten Kontakt.

Verwendung:

```typescript
readonly selectedContact =
  this.contactService.selectedContact;
```

Template:

```html
@if (selectedContact(); as contact) {
  <h2>
    {{ contact.firstName }}
    {{ contact.lastName }}
  </h2>

  <a [href]="'mailto:' + contact.email">
    {{ contact.email }}
  </a>
}
```

---

# Kontakte laden

Methode:

```typescript
getContacts(): Promise<Contact[]>
```

Die Methode:

1. lädt alle Kontakte aus Supabase
2. sortiert nach Vorname
3. sortiert bei identischem Vornamen nach Nachname
4. wandelt `ContactRow` in `Contact` um
5. gibt das sortierte Array zurück

Wichtig:

`getContacts()` gibt die Kontakte zurück, setzt aber im aktuellen Stand nicht selbst `allContacts`.

Die aufrufende Component setzt deshalb das Signal:

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

Mit lokaler Signalreferenz:

```typescript
readonly contacts = this.contactService.allContacts;

async loadContacts(): Promise<void> {
  try {
    this.contacts.set(
      await this.contactService.getContacts(),
    );
  } catch (error) {
    console.error('Contacts could not be loaded.', error);
  }
}
```

---

## Kontakte beim Start einer Component laden

```typescript
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-list',
  imports: [],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
})
export class ContactList implements OnInit {
  private readonly contactService = inject(ContactService);

  readonly contacts = this.contactService.allContacts;
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadContacts();
  }

  async loadContacts(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.contacts.set(
        await this.contactService.getContacts(),
      );
    } catch (error) {
      console.error('Contacts could not be loaded.', error);
      this.errorMessage.set(
        'Kontakte konnten nicht geladen werden.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

Template:

```html
@if (isLoading()) {
  <p>Contacts are loading...</p>
} @else if (errorMessage()) {
  <p class="error-message">
    {{ errorMessage() }}
  </p>
} @else {
  @for (contact of contacts(); track contact.id) {
    <button
      type="button"
      (click)="selectContact(contact)"
    >
      {{ contact.firstName }}
      {{ contact.lastName }}
    </button>
  }
}
```

---

# Einzelnen Kontakt laden

Methode:

```typescript
getContactById(id: string): Promise<Contact | null>
```

Beispiel:

```typescript
async loadContact(contactId: string): Promise<void> {
  try {
    const contact =
      await this.contactService.getContactById(contactId);

    this.contactService.selectedContact.set(contact);
  } catch (error) {
    console.error('Contact could not be loaded.', error);
  }
}
```

Wichtig:

`getContactById()` gibt den Kontakt zurück, setzt im aktuellen Stand aber nicht automatisch `selectedContact`.

Die Component entscheidet, ob der geladene Kontakt ausgewählt werden soll.

---

# Kontakt auswählen

Ist der Kontakt bereits in `allContacts` vorhanden, ist kein neuer Datenbankzugriff notwendig.

```typescript
selectContact(contact: Contact): void {
  this.contactService.selectedContact.set(contact);
}
```

Template:

```html
@for (contact of contacts(); track contact.id) {
  <button
    type="button"
    (click)="selectContact(contact)"
  >
    {{ contact.firstName }}
    {{ contact.lastName }}
  </button>
}
```

---

## Aktive Auswahl prüfen

```typescript
isSelected(contact: Contact): boolean {
  return this.contactService.selectedContact()?.id
    === contact.id;
}
```

Template:

```html
<button
  type="button"
  [class.contact--selected]="isSelected(contact)"
  (click)="selectContact(contact)"
>
  {{ contact.firstName }}
  {{ contact.lastName }}
</button>
```

---

# Initialen erzeugen

Methode:

```typescript
getInitials(
  firstName: string,
  lastName: string,
): string
```

Verwendung:

```typescript
getInitials(contact: Contact): string {
  return this.contactService.getInitials(
    contact.firstName,
    contact.lastName,
  );
}
```

Template:

```html
<div
  class="contact-avatar"
  [style.background-color]="contact.badgeColor"
>
  {{ getInitials(contact) }}
</div>
```

Beispiele:

```text
Anna Schmidt → AS
Max Mustermann → MM
```

Vor- und Nachname werden vor dem Ermitteln der Initialen getrimmt.

---

# Neuen Kontakt erstellen

Methode:

```typescript
createContact(
  contact: CreateContact,
): Promise<Contact>
```

Die Methode:

1. lädt bereits verwendete Badge-Farben
2. generiert eine zufällige HSL-Farbe
3. versucht eine noch nicht verwendete Farbe zu finden
4. trimmt Vorname, Nachname, E-Mail und Telefonnummer
5. speichert den Kontakt in Supabase
6. wandelt die Datenbankzeile in ein `Contact`-Model um
7. ergänzt den Kontakt in `allContacts`
8. sortiert `allContacts` neu
9. setzt den neuen Kontakt als `selectedContact`
10. gibt den Kontakt zurück

---

## Einfacher Create-Aufruf

```typescript
async createContact(): Promise<void> {
  try {
    const createdContact =
      await this.contactService.createContact({
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49 123456789',
      });

    console.log('Created contact:', createdContact);
  } catch (error) {
    console.error('Contact could not be created.', error);
  }
}
```

---

## Telefonnummer weglassen

```typescript
await this.contactService.createContact({
  firstName: 'Anna',
  lastName: 'Schmidt',
  email: 'anna.schmidt@example.com',
});
```

Die Telefonnummer wird als `null` gespeichert.

---

# Create-Dialog integrieren

Die Dialog-Component sollte keine Supabase-Abfrage ausführen.

Sie:

* verwaltet das Formular
* validiert Eingaben
* erzeugt ein `CreateContact`-Payload
* gibt das Payload über einen Output an die Parent-Component weiter

---

## Dialog-Output

```typescript
import { Component, output } from '@angular/core';
import { CreateContact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-contact-create-dialog',
  imports: [],
  templateUrl: './contact-create-dialog.html',
  styleUrl: './contact-create-dialog.scss',
})
export class ContactCreateDialog {
  readonly cancelled = output<void>();
  readonly submitted = output<CreateContact>();
}
```

---

## Parent-Component

```typescript
readonly isCreateDialogOpen = signal(false);
readonly successMessage = signal('');
readonly errorMessage = signal('');
readonly isSaving = signal(false);
```

```typescript
async createContact(
  contact: CreateContact,
): Promise<void> {
  this.isSaving.set(true);
  this.errorMessage.set('');

  try {
    await this.contactService.createContact(contact);

    this.closeCreateDialog();
    this.showSuccessMessage(
      'Contact successfully created',
    );
  } catch (error) {
    console.error('Contact could not be created.', error);
    this.errorMessage.set(
      'Kontakt konnte nicht erstellt werden.',
    );
  } finally {
    this.isSaving.set(false);
  }
}
```

Template:

```html
@if (isCreateDialogOpen()) {
  <app-contact-create-dialog
    (cancelled)="closeCreateDialog()"
    (submitted)="createContact($event)"
  />
}
```

Ein erneutes Laden der gesamten Kontaktliste ist nach `createContact()` grundsätzlich nicht notwendig, da der Service `allContacts` bereits aktualisiert und neu sortiert.

---

# Kontakt bearbeiten

Methode:

```typescript
updateContact(
  id: string,
  contact: UpdateContact,
): Promise<Contact>
```

Die Methode:

1. erstellt ein Update-Payload
2. übergibt nur gesetzte Felder
3. trimmt String-Werte
4. aktualisiert `updated_at`
5. speichert die Änderung in Supabase
6. aktualisiert `allContacts`
7. sortiert die Kontaktliste neu
8. setzt den aktualisierten Kontakt als `selectedContact`
9. gibt den aktualisierten Kontakt zurück

---

## Einzelnes Feld ändern

```typescript
await this.contactService.updateContact(
  contact.id,
  {
    email: 'new.email@example.com',
  },
);
```

---

## Alle bearbeitbaren Felder ändern

```typescript
await this.contactService.updateContact(
  contact.id,
  {
    firstName: 'Anna',
    lastName: 'Müller',
    email: 'anna.mueller@example.com',
    phone: '+49 987654321',
  },
);
```

---

## Telefonnummer entfernen

```typescript
await this.contactService.updateContact(
  contact.id,
  {
    phone: null,
  },
);
```

Die Telefonnummer wird als `null` gespeichert.

---

# Edit-Dialog integrieren

Die Parent-Component übergibt den Kontakt an den Dialog.

```html
@if (isEditDialogOpen() && contactToEdit(); as contact) {
  <app-contact-edit-dialog
    [contact]="contact"
    (cancelled)="closeEditDialog()"
    (submitted)="updateContact($event)"
  />
}
```

Parent-State:

```typescript
readonly isEditDialogOpen = signal(false);
readonly contactToEdit = signal<Contact | null>(null);
```

Dialog öffnen:

```typescript
openEditDialog(contact: Contact): void {
  this.contactToEdit.set(contact);
  this.isEditDialogOpen.set(true);
}
```

Speichern:

```typescript
async updateContact(
  update: UpdateContact,
): Promise<void> {
  const contact = this.contactToEdit();

  if (!contact) {
    return;
  }

  this.isSaving.set(true);
  this.errorMessage.set('');

  try {
    await this.contactService.updateContact(
      contact.id,
      update,
    );

    this.closeEditDialog();
    this.showSuccessMessage(
      'Contact successfully updated',
    );
  } catch (error) {
    console.error('Contact could not be updated.', error);
    this.errorMessage.set(
      'Kontakt konnte nicht aktualisiert werden.',
    );
  } finally {
    this.isSaving.set(false);
  }
}
```

Ein vollständiges Neuladen der Liste ist nach dem Update grundsätzlich nicht notwendig, da der Service den aktualisierten Kontakt in `allContacts` ersetzt und neu sortiert.

---

# Kontakt löschen

Methode:

```typescript
deleteContact(id: string): Promise<void>
```

Die Methode:

1. löscht den Kontakt aus Supabase
2. entfernt ihn aus `allContacts`
3. prüft `selectedContact`
4. setzt `selectedContact` auf `null`, wenn der ausgewählte Kontakt gelöscht wurde

---

## Löschen aus einer Parent-Component

```typescript
async deleteContact(contactId: string): Promise<void> {
  this.isSaving.set(true);
  this.errorMessage.set('');

  try {
    await this.contactService.deleteContact(contactId);

    this.closeEditDialog();
    this.showSuccessMessage(
      'Contact successfully deleted',
    );
  } catch (error) {
    console.error('Contact could not be deleted.', error);
    this.errorMessage.set(
      'Kontakt konnte nicht gelöscht werden.',
    );
  } finally {
    this.isSaving.set(false);
  }
}
```

Ein erneutes Laden der gesamten Liste ist nicht notwendig, da der Service den lokalen State bereits aktualisiert.

---

## Task-Zuweisungen beim Löschen

Die Tabelle `task_assignments` verwendet einen Fremdschlüssel zu `contacts`.

Bei korrekt konfiguriertem:

```sql
on delete cascade
```

werden die Task-Zuweisungen des gelöschten Kontakts automatisch entfernt.

Der Task selbst bleibt bestehen.

---

# Contact-Detail integrieren

Die Detail-Component kann direkt das `selectedContact`-Signal verwenden.

```typescript
import { Component, inject } from '@angular/core';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail {
  private readonly contactService = inject(ContactService);

  readonly contact = this.contactService.selectedContact;

  getInitials(
    firstName: string,
    lastName: string,
  ): string {
    return this.contactService.getInitials(
      firstName,
      lastName,
    );
  }
}
```

Template:

```html
@if (contact(); as contact) {
  <section class="contact-detail">
    <div
      class="contact-detail__avatar"
      [style.background-color]="contact.badgeColor"
    >
      {{ getInitials(
        contact.firstName,
        contact.lastName
      ) }}
    </div>

    <h2>
      {{ contact.firstName }}
      {{ contact.lastName }}
    </h2>

    <a [href]="'mailto:' + contact.email">
      {{ contact.email }}
    </a>

    @if (contact.phone) {
      <a [href]="'tel:' + contact.phone">
        {{ contact.phone }}
      </a>
    }
  </section>
}
```

---

# Alphabetische Gruppierung

`getContacts()` liefert Kontakte alphabetisch nach Vorname und anschließend Nachname sortiert.

Eine Contact-List-Component kann dadurch Buchstabenüberschriften anzeigen.

```typescript
shouldShowLetterHeader(index: number): boolean {
  if (index === 0) {
    return true;
  }

  const contacts = this.contacts();
  const currentLetter = this.getFirstLetter(
    contacts[index],
  );

  const previousLetter = this.getFirstLetter(
    contacts[index - 1],
  );

  return currentLetter !== previousLetter;
}

getFirstLetter(contact: Contact): string {
  return contact.firstName
    .trim()
    .charAt(0)
    .toUpperCase();
}
```

Template:

```html
@for (
  contact of contacts();
  track contact.id;
  let index = $index
) {
  @if (shouldShowLetterHeader(index)) {
    <h3>
      {{ getFirstLetter(contact) }}
    </h3>
  }

  <button
    type="button"
    (click)="selectContact(contact)"
  >
    {{ contact.firstName }}
    {{ contact.lastName }}
  </button>
}
```

Die Component muss die Kontakte nicht erneut sortieren, da der Service bereits sortierte Daten zurückgibt und den State nach Create und Update ebenfalls sortiert.

---

# Kontakte in Add Task verwenden

Der `ContactService` stellt die Kontaktliste bereit. Die eigentliche Task-Zuweisung wird über den `TaskService` gespeichert.

Datenfluss:

```text
ContactService
    ↓
Kontakte für Auswahl anzeigen
    ↓
Component sammelt Contact-IDs
    ↓
TaskService speichert task_assignments
```

---

## ContactService und TaskService injizieren

```typescript
private readonly contactService = inject(ContactService);
private readonly taskService = inject(TaskService);

readonly contacts = this.contactService.allContacts;
readonly selectedContactIds = signal<string[]>([]);
```

---

## Kontakte laden

```typescript
async loadContacts(): Promise<void> {
  try {
    this.contacts.set(
      await this.contactService.getContacts(),
    );
  } catch (error) {
    console.error('Contacts could not be loaded.', error);
  }
}
```

---

## Auswahl umschalten

```typescript
toggleContact(contactId: string): void {
  this.selectedContactIds.update((contactIds) => {
    if (contactIds.includes(contactId)) {
      return contactIds.filter((id) => {
        return id !== contactId;
      });
    }

    return [...contactIds, contactId];
  });
}
```

---

## Auswahl prüfen

```typescript
isContactSelected(contactId: string): boolean {
  return this.selectedContactIds().includes(contactId);
}
```

Template:

```html
@for (contact of contacts(); track contact.id) {
  <button
    type="button"
    [class.contact-option--selected]="
      isContactSelected(contact.id)
    "
    (click)="toggleContact(contact.id)"
  >
    <span
      class="contact-option__avatar"
      [style.background-color]="contact.badgeColor"
    >
      {{
        contactService.getInitials(
          contact.firstName,
          contact.lastName
        )
      }}
    </span>

    <span>
      {{ contact.firstName }}
      {{ contact.lastName }}
    </span>
  </button>
}
```

---

## IDs mit einem neuen Task speichern

```typescript
await this.taskService.createTaskWithRelations({
  task: taskPayload,
  subtasks: subtaskPayloads,
  contactIds: this.selectedContactIds(),
});
```

Der `ContactService` speichert keine Task-Zuweisungen.

Er liefert ausschließlich die Kontakte für die Auswahl.

---

# Lade- und Fehlerzustände

Der `ContactService` besitzt aktuell keine eigenen Signals für:

```text
isLoading
errorMessage
```

Diese Zustände werden von der jeweiligen Component verwaltet.

Beispiel:

```typescript
readonly isLoading = signal(false);
readonly errorMessage = signal('');
```

```typescript
async loadContacts(): Promise<void> {
  this.isLoading.set(true);
  this.errorMessage.set('');

  try {
    this.contacts.set(
      await this.contactService.getContacts(),
    );
  } catch (error) {
    console.error('Contacts could not be loaded.', error);
    this.errorMessage.set(
      'Kontakte konnten nicht geladen werden.',
    );
  } finally {
    this.isLoading.set(false);
  }
}
```

---

# Formularvalidierung

Die Eingaben werden in der Component validiert.

Der Service:

* trimmt String-Werte
* wandelt eine leere Telefonnummer in `null` um
* generiert die Badge-Farbe
* führt den Datenbankzugriff aus

Die Component sollte mindestens prüfen:

* Name ist vorhanden
* E-Mail ist vorhanden
* E-Mail hat ein gültiges Format
* Telefonnummer erfüllt das vereinbarte Format

Beispiel:

```typescript
readonly contactForm = new FormGroup({
  fullName: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
    ],
  }),
  email: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.email,
    ],
  }),
  phone: new FormControl('', {
    nonNullable: true,
  }),
});
```

---

# Full-Name-Feld in Models aufteilen

Das Formular verwendet gegebenenfalls ein gemeinsames `fullName`-Feld, während das Model Vor- und Nachname getrennt erwartet.

```typescript
private splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedName = fullName.trim();
  const [firstName, ...lastNameParts] =
    normalizedName.split(/\s+/);

  return {
    firstName,
    lastName:
      lastNameParts.join(' ') || 'Unknown',
  };
}
```

Create-Payload:

```typescript
private createContactPayload(): CreateContact {
  const formValue = this.contactForm.getRawValue();
  const name = this.splitFullName(
    formValue.fullName,
  );

  return {
    firstName: name.firstName,
    lastName: name.lastName,
    email: formValue.email.trim(),
    phone: formValue.phone.trim() || null,
  };
}
```

Dadurch wird bei nur einem Namen:

```text
firstName = eingegebener Name
lastName = Unknown
```

---

# Badge-Farben

Beim Erstellen eines Kontakts erzeugt der Service eine HSL-Farbe.

Beispiel:

```text
hsl(183 74% 43%)
```

Bereiche:

```text
Hue:        0–359
Saturation: 65–80 %
Lightness:  38–46 %
```

Der Service lädt die bereits verwendeten Farben und versucht bis zu 20-mal, eine noch nicht verwendete Farbe zu erzeugen.

Nach 20 erfolglosen Versuchen wird eine weitere zufällige Farbe zurückgegeben.

Das bedeutet:

* Kollisionen werden stark reduziert
* eine absolute Eindeutigkeit ist nach dem Fallback nicht garantiert
* die Farbe wird nur beim Erstellen erzeugt
* Updates verändern die Badge-Farbe nicht

---

# State-Verhalten

## Nach `getContacts()`

```text
Rückgabe: sortiertes Contact[]
allContacts: wird nicht automatisch gesetzt
selectedContact: bleibt unverändert
```

## Nach `getContactById()`

```text
Rückgabe: Contact oder null
allContacts: bleibt unverändert
selectedContact: bleibt unverändert
```

## Nach `createContact()`

```text
Rückgabe: erstellter Contact
allContacts: Kontakt wird ergänzt und Liste sortiert
selectedContact: neuer Kontakt
```

## Nach `updateContact()`

```text
Rückgabe: aktualisierter Contact
allContacts: Kontakt wird ersetzt und Liste sortiert
selectedContact: aktualisierter Kontakt
```

## Nach `deleteContact()`

```text
Rückgabe: void
allContacts: Kontakt wird entfernt
selectedContact: wird bei gleicher ID auf null gesetzt
```

---

# Vermeidung unnötiger Reloads

Nach diesen Methoden ist normalerweise kein vollständiger Reload notwendig:

```typescript
createContact()
updateContact()
deleteContact()
```

Der Service aktualisiert `allContacts` bereits selbst.

Nicht erforderlich:

```typescript
await this.contactService.createContact(payload);
this.contacts.set(
  await this.contactService.getContacts(),
);
```

Ausreichend:

```typescript
await this.contactService.createContact(payload);
```

Ein Reload ist nur sinnvoll, wenn:

* Daten außerhalb der aktuellen Anwendung verändert wurden
* der Serverstand ausdrücklich neu synchronisiert werden soll
* ein vorheriger Vorgang möglicherweise nur teilweise erfolgreich war
* ein Realtime-System nicht verwendet wird

---

# Fehlerbehandlung

Alle öffentlichen CRUD-Methoden werfen Supabase-Fehler weiter.

Deshalb sollte die Component `try/catch` verwenden.

```typescript
try {
  await this.contactService.deleteContact(contact.id);
} catch (error) {
  console.error('Contact could not be deleted.', error);
}
```

Fehler sollten nicht ausschließlich über `console.error` behandelt werden.

Zusätzlich sollte sichtbares Benutzerfeedback gesetzt werden:

```typescript
readonly errorMessage = signal('');
```

```typescript
catch (error) {
  console.error('Contact could not be deleted.', error);

  this.errorMessage.set(
    'Kontakt konnte nicht gelöscht werden.',
  );
}
```

---

# Testing

## Kontakte laden

* [ ] alle Kontakte werden geladen
* [ ] Kontakte sind nach Vorname sortiert
* [ ] gleiche Vornamen werden nach Nachname sortiert
* [ ] Datenbankfelder werden korrekt in `camelCase` umgewandelt
* [ ] Fehler werden an die Component weitergegeben

## Kontakt laden

* [ ] vorhandene ID liefert einen Kontakt
* [ ] unbekannte ID liefert `null`
* [ ] `selectedContact` wird nicht unbeabsichtigt verändert

## Kontakt erstellen

* [ ] Kontakt wird in Supabase gespeichert
* [ ] Eingaben werden getrimmt
* [ ] leere Telefonnummer wird als `null` gespeichert
* [ ] Badge-Farbe wird erzeugt
* [ ] Kontakt wird in `allContacts` ergänzt
* [ ] Liste bleibt alphabetisch sortiert
* [ ] neuer Kontakt wird ausgewählt

## Kontakt aktualisieren

* [ ] einzelne Felder können aktualisiert werden
* [ ] nicht übergebene Felder bleiben unverändert
* [ ] Telefonnummer kann entfernt werden
* [ ] `updated_at` wird aktualisiert
* [ ] `allContacts` wird aktualisiert
* [ ] Liste bleibt sortiert
* [ ] `selectedContact` enthält den aktuellen Stand

## Kontakt löschen

* [ ] Kontakt wird aus Supabase gelöscht
* [ ] Kontakt wird aus `allContacts` entfernt
* [ ] anderer ausgewählter Kontakt bleibt bestehen
* [ ] gelöschter ausgewählter Kontakt wird zurückgesetzt
* [ ] Task-Zuweisungen werden durch Cascade Delete entfernt
* [ ] Tasks selbst bleiben bestehen

## Initialen

* [ ] Vor- und Nachname ergeben zwei Initialen
* [ ] Leerzeichen werden entfernt
* [ ] Ausgabe ist großgeschrieben

## Component-Integration

* [ ] Service wird injiziert
* [ ] keine Component greift direkt auf Supabase zu
* [ ] Ladezustand wird angezeigt
* [ ] Fehler werden sichtbar dargestellt
* [ ] Buttons sind während des Speicherns deaktiviert
* [ ] Dialog schließt nur nach erfolgreichem Speichern
* [ ] Success-Overlay erscheint nach Erfolg
* [ ] Add-Task-Auswahl verwendet Contact-IDs

---

# Öffentliche Service-Schnittstelle

```typescript
allContacts
selectedContact

getContacts()
getContactById()

createContact()
updateContact()
deleteContact()

getInitials()
```

Alle anderen Methoden des Services sind intern und dürfen nicht aus Components aufgerufen werden.

---

# Integrationsübersicht

## Contact-Liste

Verwendet:

```typescript
getContacts()
allContacts
selectedContact
getInitials()
```

## Contact-Detail

Verwendet:

```typescript
selectedContact
getInitials()
```

## Create-Dialog beziehungsweise Parent-Page

Verwendet:

```typescript
createContact()
```

## Edit-Dialog beziehungsweise Parent-Page

Verwendet:

```typescript
updateContact()
deleteContact()
```

## Add Task

Verwendet:

```typescript
getContacts()
allContacts
getInitials()
```

Die Speicherung der Zuweisungen erfolgt über:

```typescript
TaskService.createTaskWithRelations()
TaskService.updateTaskWithRelations()
TaskService.replaceTaskAssignments()
```

---


