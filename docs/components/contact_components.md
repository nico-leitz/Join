# Contact-Components

Dieses Dokument beschreibt die Components des Kontaktbereichs und deren Zusammenarbeit mit dem `ContactService`.

Der Kontaktbereich besteht aus einer Page-Component und mehreren Child-Components. Die Page koordiniert den Ablauf. Die Child-Components übernehmen Anzeige, Formulare oder Feedback.

---

## Überblick

Der Kontaktbereich besteht aus:

```text
Contacts Page
ContactList
ContactDetail
ContactCreateDialog
ContactEditDialog
ContactSuccessOverlay
```

Zusätzlich werden Layout-Components genutzt:

```text
Header
Sidebar
Mobile Navigation
```

Der zentrale Datenfluss läuft über den `ContactService`.

```text
Component
  ↓
ContactService
  ↓
Supabase
```

---

## Grundregel

Contact-Components greifen nicht direkt auf Supabase zu.

Nicht vorgesehen:

```typescript
private readonly supabase = inject(SupabaseService).client;
```

Vorgesehen:

```typescript
private readonly contactService = inject(ContactService);
```

Der Service verwaltet:

```text
allContacts
selectedContact
CRUD-Methoden
Mapping
Sortierung
Badge-Farben
```

Die Components kümmern sich um:

```text
Darstellung
Klicks
Dialoge
Formulare
Responsive Verhalten
Feedback
```

---

## Component-Struktur

```text
src/app/features/contacts/
├── pages/
│   └── contacts/
│       ├── contacts.ts
│       ├── contacts.html
│       └── contacts.scss
└── components/
    ├── contact-list/
    ├── contact-detail/
    ├── contact-create-dialog/
    ├── contact-edit-dialog/
    └── contact-success-overlay/
```

---

## Contacts Page

Die `Contacts` Page ist die zentrale Koordinationsstelle des Kontaktbereichs.

Sie bindet die Child-Components ein:

```text
ContactList
ContactDetail
ContactCreateDialog
ContactEditDialog
ContactSuccessOverlay
Header
Sidebar
```

---

## Aufgaben der Contacts Page

Die Page ist zuständig für:

- Layout des Kontaktbereichs
- Öffnen und Schließen der Dialoge
- Weiterleiten von Dialog-Submits an den Service
- Aktualisieren der Kontaktliste nach Änderungen
- Setzen von Success-Messages
- Sperren des Body-Scrolls bei geöffneten Dialogen
- Weitergabe von Edit- und Delete-Aktionen
- Zusammenspiel von Liste, Detailansicht und Dialogen

Sie ist nicht zuständig für:

- Supabase-Abfragen
- Mapping von Datenbankfeldern
- Erzeugen von Badge-Farben
- Sortieren der Kontakte
- Validierungslogik einzelner Formularfelder

---

## State in der Contacts Page

Die Page hält lokalen UI-State:

```typescript
isCreateDialogOpen
isEditDialogOpen
selectedContact
successMessage
```

Dieser State liegt bewusst in der Page, weil er nur die aktuelle Darstellung betrifft.

Beispiele:

```text
Ist der Create-Dialog offen?
Ist der Edit-Dialog offen?
Welcher Kontakt wird gerade im Dialog bearbeitet?
Welche Erfolgsmeldung wird angezeigt?
```

Der eigentliche Daten-State liegt dagegen im `ContactService`:

```text
allContacts
selectedContact
```

---

## Warum Dialog-State in der Page liegt

Ob ein Dialog offen oder geschlossen ist, ist reine UI-Logik.

Diese Information muss nicht global im Service gespeichert werden, weil sie nur für die Contact Page relevant ist.

```text
Dialog offen
→ Page-State

Kontaktliste
→ Service-State
```

Diese Trennung verhindert, dass der Service mit UI-Zuständen überladen wird.

---

## Body-Scroll-Lock

Die Page sperrt den Body-Scroll, wenn ein Dialog geöffnet ist.

Ablauf:

```text
Dialog öffnen
  ↓
body bekommt Klasse dialog-open
  ↓
Hintergrund scrollt nicht
```

Beim Schließen wird geprüft, ob noch ein anderer Dialog offen ist.

```text
kein Dialog offen
  ↓
dialog-open entfernen
```

Das verhindert, dass auf mobilen Geräten der Hintergrund mitscrollt, während ein Dialog geöffnet ist.

---

## ContactList

Die `ContactList` zeigt die Kontaktliste an.

Typische Aufgaben:

- Kontakte laden
- Kontakte gruppiert oder sortiert anzeigen
- aktiven Kontakt hervorheben
- Klick auf einen Kontakt behandeln
- Add-Contact-Aktion auslösen
- nur den Listenbereich scrollbar halten

Die Liste arbeitet mit dem Kontakt-State aus dem Service.

```typescript
allContacts
selectedContact
```

---

## Kontakt auswählen

Beim Klick auf einen Kontakt wird der Kontakt als ausgewählt gesetzt.

Ablauf:

```text
User klickt Kontakt
  ↓
ContactService.selectedContact wird gesetzt
  ↓
ContactDetail zeigt den Kontakt an
  ↓
Listeneintrag erhält aktiven Zustand
```

Dadurch müssen `ContactList` und `ContactDetail` nicht direkt miteinander verbunden sein.

Beide nutzen denselben Service-State.

---

## Add-Contact aus der Liste öffnen

Die Liste speichert keinen Kontakt selbst.

Wenn der User den Add-Button klickt, sendet die Liste ein Event an die Page.

```typescript
createContactRequested
```

Ablauf:

```text
ContactList
  ↓
createContactRequested.emit()
  ↓
Contacts Page
  ↓
openCreateDialog()
```

Die Page entscheidet, welcher Dialog geöffnet wird.

---

## ContactDetail

Die `ContactDetail` zeigt den aktuell ausgewählten Kontakt an.

Angezeigt werden:

- Name
- Initialen-Badge
- E-Mail
- Telefonnummer
- Edit-Aktion
- Delete-Aktion oder Weitergabe an Parent
- mobile Aktionsmöglichkeiten

Die Daten kommen aus dem `ContactService`.

```text
selectedContact
```

---

## Warum ContactDetail aus dem Service liest

Die Detailansicht hängt immer vom aktuell ausgewählten Kontakt ab.

Dieser Zustand wird auch von der Liste gebraucht.

Deshalb liegt er im Service:

```text
ContactList setzt selectedContact
ContactDetail liest selectedContact
```

Das vermeidet unnötige Parent-Child-Verkettung.

---

## Edit aus ContactDetail

Wenn der User auf Edit klickt, soll die Detail-Component nicht selbst den Edit-Dialog öffnen.

Stattdessen wird ein Event an die Page gesendet.

```text
ContactDetail
  ↓
editContactRequested
  ↓
Contacts Page
  ↓
openEditDialog(contact)
```

Die Page öffnet dann den Dialog und setzt den Kontakt, der bearbeitet werden soll.

---

## ContactCreateDialog

Der `ContactCreateDialog` ist für das Erstellen eines neuen Kontakts zuständig.

Er übernimmt:

- Formularaufbau
- Eingabevalidierung
- Fehlermeldungen
- Submit-Button-Zustand
- Cancel-Aktion
- Erzeugen eines `CreateContact`-Objekts
- Senden des Ergebnisses an die Parent-Page

Der Dialog speichert den Kontakt nicht selbst.

---

## Outputs des Create-Dialogs

Der Dialog arbeitet über Outputs.

```typescript
submitted
cancelled
```

Ablauf bei Submit:

```text
Formular gültig
  ↓
CreateContact erzeugen
  ↓
submitted.emit(payload)
  ↓
Contacts Page
  ↓
ContactService.createContact()
```

Ablauf bei Cancel:

```text
User klickt Cancel oder Close
  ↓
cancelled.emit()
  ↓
Contacts Page schließt Dialog
```

---

## Warum der Create-Dialog nicht direkt speichert

Der Dialog ist eine UI-Component.

Wenn er selbst speichern würde, müsste er auch wissen:

```text
welcher Service verwendet wird
ob die Liste neu geladen werden soll
welche Success-Message erscheint
ob der Body-Scroll entsperrt werden muss
welcher Kontakt danach ausgewählt ist
```

Diese Koordination gehört in die Page und den Service.

Deshalb erzeugt der Dialog nur ein Payload und sendet es an die Parent-Page.

---

## ContactEditDialog

Der `ContactEditDialog` bearbeitet einen bestehenden Kontakt.

Er bekommt den Kontakt per Input:

```typescript
contact
```

und sendet Aktionen per Output:

```typescript
submitted
cancelled
deleted
```

---

## Aufgaben des Edit-Dialogs

Der Edit-Dialog ist zuständig für:

- Formular mit bestehenden Kontaktdaten befüllen
- Änderungen validieren
- `UpdateContact` erzeugen
- Submit an die Page senden
- Cancel an die Page senden
- Delete an die Page senden

Der Dialog entscheidet nicht selbst, wie Supabase aktualisiert wird.

---

## Edit-Flow

```text
ContactDetail
  ↓
editContactRequested
  ↓
Contacts Page öffnet EditDialog
  ↓
EditDialog erhält Contact als Input
  ↓
User ändert Daten
  ↓
submitted.emit(UpdateContact)
  ↓
Contacts Page
  ↓
ContactService.updateContact()
```

Nach erfolgreichem Update:

```text
Dialog schließen
Kontaktliste neu laden oder State aktualisieren
Success-Message anzeigen
```

---

## Delete-Flow

Der Delete-Flow läuft kontrolliert über die Page und den Service.

```text
User klickt Delete
  ↓
deleted.emit(contactId)
  ↓
Contacts Page
  ↓
ContactService.deleteContact(contactId)
  ↓
Dialog schließen
  ↓
Liste aktualisieren
```

Wenn der gelöschte Kontakt aktuell ausgewählt war, leert der `ContactService` den ausgewählten Kontakt.

---

## ContactSuccessOverlay

Das `ContactSuccessOverlay` zeigt eine Erfolgsmeldung nach einer Aktion.

Es bekommt die Nachricht per Input:

```typescript
message
```

Das Overlay enthält keine Speicherlogik und keinen eigenen Datenzugriff.

Aufgabe:

```text
Nachricht anzeigen
Animation darstellen
automatisch wieder verschwinden
```

Die Page entscheidet, welche Nachricht gesetzt wird.

Beispiele:

```text
Contact successfully created
Contact successfully updated
Contact successfully deleted
```

---

## Zusammenspiel beim Erstellen

```text
User klickt Add Contact
  ↓
ContactList sendet createContactRequested
  ↓
Contacts Page öffnet ContactCreateDialog
  ↓
User füllt Formular aus
  ↓
Dialog sendet submitted(CreateContact)
  ↓
Contacts Page ruft ContactService.createContact()
  ↓
Service speichert Kontakt
  ↓
Service setzt neuen Kontakt als selectedContact
  ↓
Page schließt Dialog
  ↓
Liste wird aktualisiert
  ↓
SuccessOverlay erscheint
```

---

## Zusammenspiel beim Bearbeiten

```text
User klickt Edit
  ↓
ContactDetail sendet editContactRequested
  ↓
Contacts Page öffnet ContactEditDialog
  ↓
Dialog erhält Kontakt als Input
  ↓
User ändert Daten
  ↓
Dialog sendet submitted(UpdateContact)
  ↓
Contacts Page ruft ContactService.updateContact()
  ↓
Service aktualisiert Kontakt
  ↓
Service aktualisiert selectedContact
  ↓
Page schließt Dialog
  ↓
Liste wird aktualisiert
  ↓
SuccessOverlay erscheint
```

---

## Zusammenspiel beim Löschen

```text
User klickt Delete
  ↓
Component sendet delete-Aktion
  ↓
Contacts Page ruft ContactService.deleteContact()
  ↓
Service löscht Kontakt aus Supabase
  ↓
Service entfernt Kontakt aus allContacts
  ↓
Service leert selectedContact, falls nötig
  ↓
Page schließt Dialog
  ↓
SuccessOverlay erscheint
```

---

## Validierung in Dialogen

Die Validierung liegt in den Dialog-Components.

Geprüft werden unter anderem:

- Pflichtfelder
- gültige E-Mail
- gültiges Telefonformat
- keine Zahlen in Namen
- keine ungültigen Zeichen in Namen

Die Dialoge verhindern den Submit, solange das Formular ungültig ist.

Der Service bekommt nur gültige Payloads.

---

## Fallback für einzelne Namen

Wenn im Formular nur ein einzelner Name eingegeben wird, wird als Nachname ein Fallback gesetzt.

```text
firstName: eingegebener Name
lastName: Unknown
```

Damit bleibt das Datenmodell vollständig, weil Kontakte im Projekt aus Vor- und Nachname bestehen.

---

## Responsive Verhalten

Der Kontaktbereich ist responsive aufgebaut.

### Desktop

Auf Desktop werden Liste und Detailansicht nebeneinander angezeigt.

```text
Sidebar
Header
ContactList
ContactDetail
```

Die Liste hat eine feste Breite.  
Die Detailansicht nimmt den restlichen Platz ein.

### Mobile und Tablet

Auf kleineren Breiten liegt der Fokus auf der Liste.

Die Detailansicht wird als eigene Ansicht oder Overlay angezeigt.

Die mobile Navigation liegt unten.  
Die Sidebar wird durch die mobile Navigation ersetzt.

---

## Scrollverhalten

Im Kontaktbereich soll nicht die ganze Seite unkontrolliert scrollen.

Wichtig:

```text
Page hält den Rahmen
Liste scrollt
Dialoge scrollen bei Bedarf intern
Header und mobile Navigation bleiben sichtbar
```

Bei geöffnetem Dialog wird der Hintergrund gesperrt.

Dadurch bleibt die Bedienung auf mobilen Geräten stabil.

---

## Events statt direkter Kopplung

Child-Components sollen Aktionen melden, aber nicht die komplette Logik selbst ausführen.

Beispiele:

```text
ContactList → createContactRequested
ContactDetail → editContactRequested
CreateDialog → submitted / cancelled
EditDialog → submitted / cancelled / deleted
```

Die Page verbindet diese Events mit Service-Methoden.

Das hält Child-Components klein und nachvollziehbar.

---

## Inputs statt Service-Pflicht

Eine Child-Component soll Daten per Input bekommen, wenn sie dadurch einfacher und unabhängiger bleibt.

Beispiel:

```text
EditDialog bekommt contact per Input
```

Die Component muss dann nicht selbst wissen, welcher Kontakt ausgewählt ist.

---

## Wann direkt Service-State genutzt wird

Direkter Service-State ist sinnvoll, wenn mehrere Components denselben Zustand teilen.

Beispiele:

```text
ContactList und ContactDetail teilen selectedContact.
ContactList nutzt allContacts.
```

Bei rein lokalen Zuständen bleibt der State in der Component oder Page.

---

## Abgrenzung: Page, Component, Service

| Aufgabe | Zuständig |
|---|---|
| Kontakt speichern | `ContactService` |
| Kontaktliste anzeigen | `ContactList` |
| Kontakt auswählen | `ContactList` + `ContactService` |
| Kontaktinformationen anzeigen | `ContactDetail` |
| Create-Dialog öffnen | `Contacts Page` |
| Edit-Dialog öffnen | `Contacts Page` |
| Formular validieren | Dialog-Component |
| Success anzeigen | `ContactSuccessOverlay` |
| Body-Scroll sperren | `Contacts Page` |
| Datenbankfelder mappen | `ContactService` |
| Badge-Farbe erzeugen | `ContactService` |

---

## Häufige Fehler vermeiden

### Dialoge nicht direkt speichern lassen

Falsch:

```text
Dialog ruft ContactService oder Supabase selbst auf und entscheidet alles alleine.
```

Richtig:

```text
Dialog sendet Payload.
Page ruft Service auf.
Service speichert.
```

---

### Keine Supabase-Logik in Components

Falsch:

```typescript
this.supabase.from('contacts').select('*')
```

Richtig:

```typescript
this.contactService.getContacts()
```

---

### Keine Datenbankfelder im Template

Falsch:

```html
{{ contact.first_name }}
```

Richtig:

```html
{{ contact.firstName }}
```

---

### selectedContact nicht doppelt halten

Der fachliche ausgewählte Kontakt liegt im `ContactService`.

Die Page darf zusätzlich einen lokalen Kontakt für den Edit-Dialog halten, sollte diesen aber nach dem Schließen wieder leeren.

---

### Body-Scroll wieder entsperren

Wenn ein Dialog geschlossen wird oder die Page zerstört wird, muss der Body-Scroll wieder entsperrt werden.

Deshalb ist ein Cleanup in `ngOnDestroy()` wichtig.

---

## Testbare User-Flows

Diese Flows sollten nach Änderungen geprüft werden:

```text
Kontaktliste lädt
Kontakt auswählen
Detailansicht zeigt richtigen Kontakt
Create-Dialog öffnen
Create-Dialog schließen
Kontakt erstellen
neuer Kontakt ist ausgewählt
Edit-Dialog öffnen
Kontakt aktualisieren
Liste bleibt sortiert
Kontakt löschen
selectedContact wird geleert
SuccessOverlay erscheint
Body-Scroll ist nach Dialog wieder frei
Mobile Ansicht ohne horizontalen Scroll
```

---

## Zusammenfassung

Die Contact-Components sind klar nach Aufgabe getrennt.

Die Page koordiniert den Kontaktbereich.  
Die Liste zeigt Kontakte und setzt die Auswahl.  
Die Detailansicht zeigt den ausgewählten Kontakt.  
Create- und Edit-Dialoge validieren Formulare und senden Payloads.  
Das SuccessOverlay zeigt nur Feedback.  
Der `ContactService` übernimmt Speicherung, Mapping, Sortierung und gemeinsamen State.

Dadurch bleiben UI, Datenlogik und Service-State sauber getrennt.