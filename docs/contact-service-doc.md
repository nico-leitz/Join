# ContactService

Der `ContactService` ist die zentrale Anwendungsschicht für Kontakte. Er verbindet die Contact-Components mit Supabase und stellt den gemeinsamen Kontakt-State bereit.

Komponenten arbeiten nicht direkt mit der Datenbank. Sie verwenden den Service, um Kontakte zu laden, zu erstellen, zu bearbeiten, zu löschen oder den aktuell ausgewählten Kontakt zu setzen.

---

## Aufgabe des ContactService

Der Service ist zuständig für:

- Kontakte aus Supabase laden
- einzelne Kontakte laden
- Kontakte erstellen
- Kontakte aktualisieren
- Kontakte löschen
- Kontaktliste im lokalen State halten
- aktuell ausgewählten Kontakt verwalten
- Kontakte alphabetisch sortieren
- Datenbankfelder in Angular-Models umwandeln
- Payloads für Supabase vorbereiten
- Initialen für Kontakt-Badges erzeugen
- Badge-Farben generieren

Der Service enthält keine UI-Logik. Dialoge, Formulare, Buttons, mobile Menüs und Success-Overlays bleiben Aufgabe der Components.

---

## Datenfluss

Der normale Datenfluss läuft über die Component zum Service.

```text
Contact Component
  ↓
ContactService
  ↓
SupabaseService
  ↓
Supabase contacts
```

Beim Lesen werden Datenbankdaten in das Angular-Model umgewandelt:

```text
ContactRow
  ↓
mapContactRow()
  ↓
Contact
  ↓
Component
```

Die Component arbeitet dadurch mit `camelCase` und muss keine Datenbankfelder wie `first_name` oder `badge_color` kennen.

---

## State im ContactService

Der Service stellt zwei zentrale Signals bereit:

```typescript
selectedContact = signal<Contact | null>(null);
allContacts = signal<Contact[]>([]);
```

---

## `allContacts`

`allContacts` enthält die Kontaktliste, die in der Anwendung angezeigt wird.

Der State wird aktualisiert nach:

```text
createContact()
updateContact()
deleteContact()
```

Dadurch muss die Liste nicht nach jeder kleinen Änderung vollständig neu aufgebaut werden.

---

## `selectedContact`

`selectedContact` enthält den aktuell ausgewählten Kontakt.

Der Wert wird gesetzt, wenn:

- ein Kontakt ausgewählt wird
- ein Kontakt erstellt wurde
- ein Kontakt aktualisiert wurde

Der Wert wird geleert, wenn:

- der aktuell ausgewählte Kontakt gelöscht wurde

Dadurch bleiben ContactList und ContactDetail synchron.

---

## Kontakte laden

### `getContacts()`

Diese Methode lädt alle Kontakte aus der Tabelle:

```text
contacts
```

Die Abfrage sortiert bereits in Supabase nach:

```text
first_name
last_name
```

Anschließend sortiert der Service die gemappten Kontakte zusätzlich lokal.

Ablauf:

```text
Supabase select contacts
  ↓
ContactRow[]
  ↓
mapContactRows()
  ↓
Contact[]
  ↓
sortContacts()
  ↓
Rückgabe an Component
```

Die lokale Sortierung stellt sicher, dass auch neu erstellte oder aktualisierte Kontakte im Signal-State korrekt einsortiert bleiben.

---

## Einzelnen Kontakt laden

### `getContactById(id)`

Diese Methode lädt einen Kontakt über seine ID.

Wenn kein Kontakt gefunden wird, gibt die Methode `null` zurück.

Ablauf:

```text
id
  ↓
Supabase select where id
  ↓
ContactRow oder null
  ↓
Contact oder null
```

Diese Methode ist sinnvoll, wenn ein Kontakt gezielt nachgeladen werden muss.

---

## Kontakt erstellen

### `createContact(contact)`

Beim Erstellen eines Kontakts passiert mehr als nur ein Insert.

Ablauf:

```text
CreateContact
  ↓
eindeutige Badge-Farbe erzeugen
  ↓
Insert-Payload bauen
  ↓
Supabase insert
  ↓
ContactRow
  ↓
Contact
  ↓
Kontakt in allContacts einfügen
  ↓
createdContact als selectedContact setzen
```

Nach dem Erstellen ist der neue Kontakt direkt ausgewählt. Dadurch zeigt die Detailansicht sofort den neu angelegten Kontakt.

---

## Warum nach dem Erstellen direkt ausgewählt wird

Nach dem Speichern erwartet der User, dass der neue Kontakt sichtbar und aktiv ist.

Deshalb setzt der Service:

```typescript
this.selectedContact.set(createdContact);
```

Das verhindert, dass nach dem Erstellen noch ein alter Kontakt ausgewählt bleibt oder die Detailansicht leer wirkt.

---

## Kontakt aktualisieren

### `updateContact(id, contact)`

Diese Methode aktualisiert nur die übergebenen Felder.

Ablauf:

```text
UpdateContact
  ↓
Update-Payload bauen
  ↓
Supabase update
  ↓
ContactRow
  ↓
Contact
  ↓
Kontakt in allContacts ersetzen
  ↓
selectedContact aktualisieren
```

Nach dem Update wird der Kontakt im lokalen State ersetzt und die Liste erneut sortiert.

---

## Warum Updates sortiert werden

Wenn sich der Vor- oder Nachname ändert, kann sich die Position in der Kontaktliste ändern.

Deshalb wird nach einem Update nicht nur der Kontakt ersetzt, sondern die Liste erneut sortiert.

```text
Kontakt ersetzen
  ↓
sortContacts()
  ↓
allContacts aktualisieren
```

So bleibt die ContactList alphabetisch korrekt.

---

## Kontakt löschen

### `deleteContact(id)`

Diese Methode löscht einen Kontakt aus Supabase und entfernt ihn anschließend aus dem lokalen State.

Ablauf:

```text
id
  ↓
Supabase delete
  ↓
Kontakt aus allContacts entfernen
  ↓
selectedContact leeren, falls dieser Kontakt ausgewählt war
```

Wird ein nicht ausgewählter Kontakt gelöscht, bleibt `selectedContact` unverändert.

Wird der ausgewählte Kontakt gelöscht, wird die Detailansicht geleert.

---

## Initialen erzeugen

### `getInitials(firstName, lastName)`

Diese Methode erzeugt die Initialen für Kontakt-Badges.

Beispiel:

```text
Max Mustermann
→ MM
```

Die Methode nimmt jeweils den ersten Buchstaben aus Vor- und Nachname und gibt das Ergebnis in Großbuchstaben zurück.

Diese Logik liegt im Service, weil Initialen an mehreren Stellen genutzt werden können:

```text
ContactList
ContactDetail
Dialoge
Task-Karten
```

---

## Mapping

Supabase liefert Daten im Datenbankformat.

Beispiel:

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

Angular verwendet ein lesbareres Application-Model:

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

Die Umwandlung passiert im Service über:

```text
mapContactRow()
mapContactRows()
```

Typische Feldumwandlungen:

```text
first_name  → firstName
last_name   → lastName
badge_color → badgeColor
created_at  → createdAt
updated_at  → updatedAt
```

Komponenten sollen nur mit `Contact` arbeiten, nicht mit `ContactRow`.

---

## Insert-Payload

Beim Erstellen wird aus `CreateContact` ein Supabase-Payload gebaut.

```typescript
private createInsertPayload(
  contact: CreateContact,
  badgeColor: string
): Partial<ContactRow>
```

Dabei werden Texte getrimmt:

```text
firstName.trim()
lastName.trim()
email.trim()
phone.trim()
```

Leere Telefonnummern werden als `null` gespeichert.

Das verhindert leere Strings in optionalen Datenbankfeldern.

---

## Update-Payload

Beim Aktualisieren werden nur die Felder gesetzt, die wirklich übergeben wurden.

```typescript
private createUpdatePayload(contact: UpdateContact): Partial<ContactRow>
```

Beispiel:

```text
firstName vorhanden
→ first_name wird gesetzt

firstName undefined
→ first_name wird nicht verändert
```

Außerdem wird `updated_at` gesetzt.

Dadurch kann ein Update gezielt einzelne Felder ändern, ohne andere Daten zu überschreiben.

---

## Badge-Farbe

Jeder Kontakt erhält beim Erstellen eine Badge-Farbe.

Der Service erzeugt diese Farbe über:

```text
createUniqueBadgeColor()
createRandomBadgeColor()
getUsedBadgeColors()
```

---

## Warum Badge-Farben im Service erzeugt werden

Die Badge-Farbe gehört zu den Kontaktdaten und wird dauerhaft mit dem Kontakt gespeichert.

Deshalb wird sie nicht in der Component erzeugt.

Die Component zeigt die Farbe nur an.  
Der Service entscheidet, welche Farbe beim Erstellen gespeichert wird.

---

## Eindeutige Badge-Farbe

Beim Erstellen lädt der Service zuerst alle bereits verwendeten Badge-Farben.

```text
getUsedBadgeColors()
```

Danach versucht er mehrfach, eine neue zufällige Farbe zu erzeugen, die noch nicht verwendet wird.

```text
maximal 20 Versuche
```

Wenn nach mehreren Versuchen keine freie Farbe gefunden wurde, wird trotzdem eine neue Farbe erzeugt.

Das ist eine pragmatische Lösung für die Demo, weil die Farbpalette dynamisch über HSL erzeugt wird und Kollisionen unwahrscheinlich sind.

---

## Lokale State-Updates

Der Service aktualisiert den lokalen State nach erfolgreichen Schreiboperationen.

### Kontakt hinzufügen

```text
addContactToState()
```

Fügt den neuen Kontakt in `allContacts` ein und sortiert die Liste.

### Kontakt ersetzen

```text
updateContactInState()
replaceContact()
```

Ersetzt den Kontakt anhand seiner ID und sortiert danach neu.

### Kontakt entfernen

```text
removeContactFromState()
```

Entfernt den Kontakt aus der Liste und leert `selectedContact`, falls der gelöschte Kontakt ausgewählt war.

---

## Sortierung

Kontakte werden alphabetisch sortiert nach:

```text
firstName
lastName
```

Die Sortierung erfolgt über:

```text
sortContacts()
compareContacts()
```

Wenn zwei Kontakte denselben Vornamen haben, entscheidet der Nachname.

Dadurch bleibt die Liste stabil und nachvollziehbar.

---

## Warum Components nicht direkt Supabase nutzen

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly contactService = inject(ContactService);
```

Der Vorteil:

```text
Components bleiben kleiner.
Mapping bleibt zentral.
Sortierung bleibt einheitlich.
State bleibt synchron.
CRUD-Logik wird nicht dupliziert.
```

---

## Verwendung in Components

Eine Contact-Component kann den Service injizieren:

```typescript
private readonly contactService = inject(ContactService);
```

Und State verwenden:

```typescript
readonly contacts = this.contactService.allContacts;
readonly selectedContact = this.contactService.selectedContact;
```

---

## Beispiel: Kontakte laden

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

Die Component entscheidet über Fehleranzeige oder weiteres UI-Verhalten.  
Der Service liefert die Daten und stellt Mapping, Sortierung und CRUD bereit.

---

## Beispiel: Kontakt erstellen

```typescript
async createContact(contact: CreateContact): Promise<void> {
  try {
    await this.contactService.createContact(contact);
    this.closeCreateDialog();
    this.showSuccessMessage();
  } catch (error) {
    console.error('Contact could not be created.', error);
  }
}
```

Der Service speichert den Kontakt, sortiert die Liste und setzt den neuen Kontakt als ausgewählt.

---

## Beispiel: Kontakt aktualisieren

```typescript
async updateContact(
  id: string,
  contact: UpdateContact,
): Promise<void> {
  try {
    await this.contactService.updateContact(id, contact);
    this.closeEditDialog();
  } catch (error) {
    console.error('Contact could not be updated.', error);
  }
}
```

Nach erfolgreichem Update ist der Kontakt im Service-State aktuell.

---

## Beispiel: Kontakt löschen

```typescript
async deleteContact(id: string): Promise<void> {
  try {
    await this.contactService.deleteContact(id);
  } catch (error) {
    console.error('Contact could not be deleted.', error);
  }
}
```

Wenn der gelöschte Kontakt ausgewählt war, leert der Service automatisch `selectedContact`.

---

## Fehlerbehandlung

Der `ContactService` wirft Supabase-Fehler weiter.

Die Component fängt diese Fehler ab:

```typescript
try {
  await this.contactService.deleteContact(id);
} catch (error) {
  console.error('Contact could not be deleted.', error);
}
```

Dadurch kann die Component entscheiden, ob ein Dialog offen bleibt, eine Meldung angezeigt wird oder ein erneuter Versuch möglich ist.

---

## Abgrenzung zum TaskService

Der `ContactService` ist einfacher als der `TaskService`.

Der Grund:

```text
Ein Kontakt liegt direkt in einer Tabelle.
Ein Task besteht aus mehreren Tabellen und Relationen.
```

Der `ContactService` arbeitet direkt mit der Tabelle `contacts`.

Der `TaskService` nutzt zusätzlich:

```text
tasks
subtasks
task_assignments
contacts
```

Deshalb benötigt der Task-Bereich zusätzliche Mapper, Repository-Methoden und Synchronisierungslogik.

---

## Wichtige Regeln

- Components greifen nicht direkt auf Supabase zu.
- Components verwenden `Contact`, nicht `ContactRow`.
- Datenbankfelder bleiben im Service.
- Kontakte werden im Service sortiert.
- Der ausgewählte Kontakt liegt im Service-State.
- Ein neuer Kontakt wird nach dem Erstellen ausgewählt.
- Beim Löschen des ausgewählten Kontakts wird die Auswahl geleert.
- Badge-Farben werden beim Erstellen im Service erzeugt.
- Telefonnummern können `null` sein.
- Fehler werden an Components weitergegeben.

---

## Zusammenfassung

Der `ContactService` kapselt die komplette Kontakt-Datenlogik.

Er lädt Kontakte aus Supabase, mappt Datenbankzeilen in Angular-Models, hält die Kontaktliste sortiert und verwaltet den aktuell ausgewählten Kontakt.

Die Contact-Components konzentrieren sich dadurch auf Darstellung, Formulare, Dialoge und Benutzerinteraktion.