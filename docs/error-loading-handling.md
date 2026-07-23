# Error- und Loading-Handling

Dieses Dokument beschreibt, wie Fehler und Ladezustände im Join-Projekt behandelt werden. Ziel ist, dass Services, Components und UI einheitlich auf laufende Requests und Fehler reagieren.

---

## Grundregel

Datenoperationen können fehlschlagen.

Deshalb gilt:

```text
Service
→ führt Datenoperation aus
→ setzt Loading- und Fehlerstatus
→ wirft Fehler weiter

Component
→ ruft Service auf
→ reagiert auf Erfolg oder Fehler im UI
```

Die Component entscheidet, was für den User sichtbar passiert.

---

## Verantwortlichkeiten

### Service

Ein Service ist zuständig für:

```text
Request starten
Loading-State setzen
alte Fehlermeldung leeren
Datenoperation ausführen
lokalen State aktualisieren
Fehlerstatus setzen
Fehler weiterwerfen
Loading-State zurücksetzen
```

### Component

Eine Component ist zuständig für:

```text
Buttons deaktivieren
Loader anzeigen
Fehlermeldung anzeigen
Dialog offen lassen oder schließen
Formular zurücksetzen
Success-Overlay anzeigen
Navigation ausführen
lokalen UI-State wiederherstellen
```

---

## Loading-State

Ein Loading-State zeigt an, dass gerade eine Operation läuft.

Beispiel:

```typescript
readonly isLoading = signal(false);
```

Typischer Ablauf:

```text
Request startet
  ↓
isLoading = true

Request endet
  ↓
isLoading = false
```

---

## Loading-State im Service

Service-Methoden sollen den Loading-State kontrolliert setzen.

```typescript
private prepareLoadingState(): void {
  this.isLoading.set(true);
  this.errorMessage.set('');
}
```

Nach Abschluss wird der Zustand zurückgesetzt.

```typescript
finally {
  this.isLoading.set(false);
}
```

Dadurch bleibt der Loading-State auch bei Fehlern korrekt.

---

## Fehler-State

Ein Service kann eine fachliche Fehlermeldung halten.

```typescript
readonly errorMessage = signal('');
```

Vor einem neuen Request wird die alte Meldung geleert.

```text
neuer Request
→ alte Fehlermeldung entfernen
```

Bei Fehler:

```text
Fehler abfangen
→ passende Meldung setzen
→ Fehler weiterwerfen
```

---

## Fehler weiterwerfen

Services sollen Fehler nicht still verschlucken.

Falsch:

```typescript
catch (error) {
  this.errorMessage.set('Task could not be saved.');
}
```

Richtig:

```typescript
catch (error) {
  this.errorMessage.set('Task could not be saved.');
  throw error;
}
```

Nur so kann die Component entscheiden, was im UI passieren soll.

---

## Component mit try/catch

Components fangen Service-Fehler mit `try/catch`.

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  try {
    await this.taskService.createTaskWithRelations(
      this.createTaskInput(),
    );

    this.closeDialog();
    this.showSuccessMessage();
  } catch (error) {
    console.error('Task could not be created.', error);
  }
}
```

Bei Fehler bleibt das Formular offen.

---

## UI nach Erfolg

Nach erfolgreicher Operation kann die Component:

```text
Dialog schließen
Formular zurücksetzen
Success-Overlay anzeigen
Board neu laden
zur Board-Seite navigieren
lokalen State leeren
```

Beispiel:

```typescript
await this.taskService.createTaskWithRelations(input);

this.resetForm();
this.showSuccessMessage();
await this.router.navigate(['/board']);
```

---

## UI nach Fehler

Nach einem Fehler soll der User nicht seine Eingaben verlieren.

Erwartung:

```text
Dialog bleibt offen
Formulardaten bleiben erhalten
Fehlermeldung wird angezeigt
Submit kann erneut versucht werden
```

Nicht gewünscht:

```text
Dialog schließt trotz Fehler
Formular wird geleert
User sieht keine Rückmeldung
```

---

## Buttons während Loading

Buttons sollen während eines Requests deaktiviert werden.

```html
<button
  type="submit"
  [disabled]="form.invalid || isLoading()"
>
  Save
</button>
```

Das verhindert Doppel-Submits.

---

## Loader anzeigen

Ein Loader kann angezeigt werden, wenn Daten geladen werden.

```html
@if (isLoading()) {
  <p>Loading...</p>
}
```

Bei Buttons reicht oft ein deaktivierter Zustand oder ein kurzer Textwechsel.

```html
<button
  type="submit"
  [disabled]="isLoading()"
>
  {{ isLoading() ? 'Saving...' : 'Save' }}
</button>
```

---

## Fehler anzeigen

Fehlermeldungen können aus dem Service-State kommen.

```typescript
readonly errorMessage = this.taskService.errorMessage;
```

Im Template:

```html
@if (errorMessage()) {
  <p class="error-message">
    {{ errorMessage() }}
  </p>
}
```

---

## ContactService

Der `ContactService` wirft Supabase-Fehler weiter.

Components, die Kontakte erstellen, bearbeiten oder löschen, sollen Fehler selbst abfangen.

Beispiel:

```typescript
try {
  await this.contactService.updateContact(id, payload);
  this.closeEditDialog();
} catch (error) {
  console.error('Contact could not be updated.', error);
}
```

---

## TaskService

Der `TaskService` besitzt zusätzlich:

```text
isLoading
errorMessage
```

Diese Signals können direkt in Task- und Board-Components genutzt werden.

Typische Verwendung:

```typescript
readonly isLoading = this.taskService.isLoading;
readonly errorMessage = this.taskService.errorMessage;
```

---

## Fehler beim Create mit Relationen

Beim Erstellen eines Tasks mit Relationen kann ein Fehler nach dem Task-Insert passieren.

Beispiel:

```text
Task wurde erstellt
Subtask-Erstellung schlägt fehl
```

Der Service versucht dann, den neu erstellten Task wieder zu löschen.

```text
Create fehlgeschlagen
  ↓
Rollback des erstellten Tasks
  ↓
Fehler weiterwerfen
```

Die Component zeigt den Fehler und lässt das Formular offen.

---

## Fehler beim Update mit Relationen

Beim Update kann ein Fehler während der Synchronisierung passieren.

Beispiel:

```text
Task aktualisiert
Subtask-Sync schlägt fehl
```

Der Service versucht danach, den tatsächlichen Datenbankstand wieder zu laden.

```text
Update fehlgeschlagen
  ↓
Refresh des Task-States
  ↓
Fehler weiterwerfen
```

Dadurch wird der lokale State möglichst wieder mit Supabase synchronisiert.

---

## Fehler beim Drag-and-drop

Drag-and-drop kann optimistisch arbeiten.

Ablauf:

```text
aktuellen Zustand merken
UI lokal ändern
Status und sortOrder speichern
bei Fehler alten Zustand wiederherstellen oder Board neu laden
```

Beispiel:

```typescript
const previousTasks = this.taskService.allTasks();

try {
  await this.taskService.updateTask(task.id, {
    status: targetStatus,
    sortOrder: targetIndex,
  });
} catch (error) {
  this.taskService.allTasks.set(previousTasks);
  console.error('Task could not be moved.', error);
}
```

---

## Supabase-Fehler

Supabase-Fehler entstehen bei konkreten Abfragen.

Typischer Ablauf:

```text
Repository führt Query aus
Supabase gibt error zurück
Repository wirft error
Service setzt Meldung
Component reagiert
```

Repositorys sollen Fehler nicht nur loggen, sondern weitergeben.

---

## Keine stillen Fehler

Nicht erlaubt:

```typescript
catch (error) {
  console.error(error);
}
```

ohne weitere Reaktion.

Besser:

```typescript
catch (error) {
  this.errorMessage.set('Data could not be loaded.');
  throw error;
}
```

oder in Components:

```typescript
catch (error) {
  this.localErrorMessage.set('Data could not be loaded.');
  console.error('Data could not be loaded.', error);
}
```

---

## Lokale Fehlermeldungen

Manche Fehler sind nur für eine Component relevant.

Beispiele:

```text
Formular konnte nicht gespeichert werden
Dialogaktion fehlgeschlagen
mobile Move-Aktion fehlgeschlagen
```

Dann kann die Component einen lokalen Fehler-State halten.

```typescript
readonly localErrorMessage = signal('');
```

Service-weite Fehler sind sinnvoll, wenn mehrere Components denselben Fehler anzeigen können.

---

## Fehlermeldungen für User

Fehlermeldungen sollen verständlich sein.

Gut:

```text
Task could not be saved.
Contact could not be deleted.
Board could not be loaded.
```

Ungünstig:

```text
Error
Something went wrong
Supabase failed
undefined is not an object
```

Technische Details bleiben in der Konsole.

---

## Console-Ausgaben

`console.error` ist in bewusster Fehlerbehandlung erlaubt.

Temporäre Debug-Ausgaben müssen vor dem Commit entfernt werden.

Nicht committen:

```typescript
console.log('test');
console.log(data);
console.log('hier');
```

---

## Loading bei parallelen Requests

Ein einzelnes `isLoading` reicht für einfache Abläufe.

Wenn später mehrere Requests parallel laufen, kann ein einzelner Loading-State ungenau sein.

Mögliche spätere Aufteilung:

```text
isLoadingTasks
isSavingTask
isDeletingTask
isLoadingDetails
```

Für den aktuellen Projektstand reicht ein gemeinsamer Loading-State im `TaskService`.

---

## Testbare Flows

Prüfen:

```text
Button ist während Speichern deaktiviert
Doppel-Submit ist nicht möglich
Fehler schließt Dialog nicht
Formulardaten bleiben nach Fehler erhalten
Success erscheint nur nach Erfolg
Fehler wird sichtbar angezeigt
Konsole zeigt keine unerwarteten Errors
Loading-State wird nach Fehler zurückgesetzt
Loading-State wird nach Erfolg zurückgesetzt
Board kann nach Fehler neu geladen werden
```

---

## Häufige Fehler vermeiden

### Loading nicht zurücksetzen

Falsch:

```typescript
this.isLoading.set(true);
await this.repository.getTasks();
```

Richtig:

```typescript
this.isLoading.set(true);

try {
  await this.repository.getTasks();
} finally {
  this.isLoading.set(false);
}
```

---

### Fehler verschlucken

Falsch:

```typescript
catch {
  this.errorMessage.set('Failed.');
}
```

Richtig:

```typescript
catch (error) {
  this.errorMessage.set('Failed.');
  throw error;
}
```

---

### Dialog trotz Fehler schließen

Falsch:

```typescript
try {
  await this.save();
} catch {}

this.closeDialog();
```

Richtig:

```typescript
try {
  await this.save();
  this.closeDialog();
} catch (error) {
  console.error('Save failed.', error);
}
```

---

### Success bei Fehler anzeigen

Falsch:

```typescript
await this.save().catch(...);
this.showSuccessMessage();
```

Richtig:

```typescript
try {
  await this.save();
  this.showSuccessMessage();
} catch (error) {
  console.error('Save failed.', error);
}
```

---

## Zusammenfassung

Fehler und Ladezustände werden bewusst getrennt behandelt.

Services setzen Loading- und Fehlerstatus und werfen Fehler weiter.  
Components reagieren im UI auf Erfolg oder Fehler.  
Dialoge schließen nur nach erfolgreichem Speichern.  
Formulare bleiben bei Fehlern erhalten.  
Buttons werden während Requests deaktiviert.

Dadurch bleibt die Anwendung stabil und für User nachvollziehbar.