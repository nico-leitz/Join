# Tests

Dieses Dokument beschreibt den Testaufbau, die vorhandenen Tests und die Grenzen der automatisierten Prüfung im finalen Join-Projekt.

## Ziel der Tests

Die Tests sichern insbesondere:

- Authentifizierungsabläufe
- Session-Wiederherstellung
- Route Guards
- Mapper und Hilfsfunktionen
- Service-State und Fehlerbehandlung
- Formularvalidierung
- Kontaktaktionen
- Task-Erstellung und -Bearbeitung
- Board-Darstellung
- Statusänderungen und Sortierung
- Dialog- und Komponentenverhalten

Die Tests sollen fachliche Regressionen erkennen. Sie ersetzen keine vollständige Prüfung von Layout, Responsivität, Supabase-RLS oder Barrierefreiheit im echten Browser.

## Teststack

Das Projekt verwendet:

| Werkzeug | Zweck |
| --- | --- |
| Angular Test Runner | Integration der Tests in Angular |
| Vitest `4.1.10` | Ausführung und Assertions |
| jsdom | simulierte Browserumgebung |
| Angular TestBed | Erzeugung und Konfiguration von Angular-Komponenten und Services |
| Test-Doubles und Spies | kontrollierte Abbildung externer Abhängigkeiten |

Der Testbefehl ist in `package.json` definiert:

```json
{
  "scripts": {
    "test": "ng test"
  }
}
```

## TypeScript-Konfiguration

`tsconfig.spec.json` erweitert die allgemeine TypeScript-Konfiguration:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": [
    "src/**/*.d.ts",
    "src/**/*.spec.ts"
  ]
}
```

Die Anwendungskonfiguration schließt Spec-Dateien aus dem produktiven Build aus.

Damit gilt:

```text
tsconfig.app.json
→ Anwendungscode ohne Tests

tsconfig.spec.json
→ Testcode und Vitest-Typen
```

## Tests ausführen

Einmaliger vollständiger Lauf:

```bash
npm test -- --watch=false
```

Direkt über Angular:

```bash
ng test --watch=false
```

Während der Entwicklung:

```bash
npm test
```

Vor einem Review oder Pull Request werden mindestens ausgeführt:

```bash
npm test -- --watch=false
npm run build
git diff --check
git status --short
```

## Finaler Teststand

Im final geprüften Projektstand bestehen:

```text
214 von 214 Tests
```

Ein bestandener Testlauf bedeutet:

- alle Spec-Dateien wurden kompiliert
- alle Assertions waren erfolgreich
- Vitest wurde mit Exit-Code `0` beendet

Die Zahl ist keine Aussage über eine prozentuale Code-Coverage. Für den finalen Stand ist kein vollständiger Coverage-Bericht dokumentiert.

## Organisation

Tests liegen überwiegend direkt neben der getesteten Datei:

```text
auth.service.ts
auth.service.spec.ts
```

Diese Struktur erleichtert:

- das Auffinden der zuständigen Tests
- gemeinsame Änderungen an Implementierung und Spec
- das Entfernen veralteter Tests
- Reviews innerhalb eines Features

## Vorhandene Testbereiche

### Core

```text
src/app/core/repositories/auth.repository.spec.ts
src/app/core/services/auth.service.spec.ts
src/app/core/services/contact.service.spec.ts
src/app/core/guards/auth.guard.spec.ts
src/app/core/mappers/auth.mapper.spec.ts
src/app/core/utils/task-order.utils.spec.ts
```

Geprüft werden unter anderem:

- Weitergabe von Auth-Anfragen an Supabase
- Auth-State vor und nach Anmeldung
- Registrierung mit akzeptierter Datenschutzerklärung
- Anmeldung mit E-Mail und Passwort
- anonymer Gastzugang
- einmalige Session-Wiederherstellung
- Abmeldung und Zurücksetzen des Users
- Normalisierung von Auth-Metadaten
- Behandlung fehlender Namensbestandteile
- Navigation geschützter und öffentlicher Routen
- Kontakt-State und Kontaktaktionen
- Sortierung und Normalisierung von Taskpositionen

### Authentifizierung

```text
src/app/features/auth/pages/signup/signup.spec.ts
src/app/features/auth/pages/login/login.spec.ts
```

Die Auth-Komponententests prüfen unter anderem:

- initialen Formularzustand
- Pflichtfelder
- E-Mail-Validierung
- Passwortvalidierung
- Passwortwiederholung
- Datenschutzerklärung
- Submit mit gültigen Daten
- Darstellung von Auth-Fehlern
- deaktivierte Aktionen während eines Requests
- Weiterleitung nach erfolgreicher Anmeldung
- Gastzugang

Die tatsächliche Passwortstärke wird zusätzlich von Supabase durchgesetzt. Frontendtests ersetzen diese Backendvalidierung nicht.

### Kontakte

```text
src/app/features/contacts/components/contact-list/contact-list.spec.ts
src/app/features/contacts/components/contact-detail/contact-detail.spec.ts
src/app/features/contacts/components/contact-create-dialog/content-create-dialog.spec.ts
src/app/features/contacts/components/contact-edit-dialog/contact-edit.spec.ts
src/app/features/contacts/components/contact-success-overlay/contact-success-overlay.spec.ts
```

Die Tests decken unter anderem ab:

- Darstellung und Auswahl von Kontakten
- Detaildarstellung
- Create- und Edit-Validierung
- Formularübermittlung
- Kontaktaktionen
- Fehlerzustände
- Success-Overlay
- Component-Events an die übergeordnete Seite

Die echte Persistenz und die RLS-Regeln werden dabei nicht gegen eine produktive Supabase-Datenbank getestet.

### Add Task

```text
src/app/features/add-task/components/add-task-dialog/add-task-dialog.spec.ts
src/app/features/add-task/components/add-task-content/add-task-content.spec.ts
src/app/features/add-task/pages/add-task-page/add-task-page.spec.ts
```

Geprüft werden unter anderem:

- Initialisierung des Formulars
- Pflichtfeldvalidierung
- Kategorie und Priorität
- Datum
- Subtasks
- Kontaktauswahl
- Erstellung eines Tasks
- Success-State
- Schließen des Dialogs
- Übernahme eines gültigen Taskstatus aus Query-Parametern

Die Datumsvalidierung beim Erstellen eines Tasks unterscheidet sich bewusst von der Validierung beim Bearbeiten eines vorhandenen Tasks.

### Board

```text
src/app/features/board/components/task-card/task-card.spec.ts
src/app/features/board/components/board-cards-dialog/board-card.spec.ts
src/app/features/board/pages/board/board.spec.ts
```

Die Board-Tests prüfen unter anderem:

- Zuordnung von Tasks zu Statusspalten
- Suche und Filterung
- Task-Kartendarstellung
- Fortschritt von Subtasks
- Kontakt-Badges
- Öffnen der Taskdetails
- Editieren und Löschen
- Aktualisierung einzelner Subtasks
- Statusänderungen
- Positionsverwaltung
- Fehler beim Laden der Boarddaten
- Fehler nach teilweise erfolgreichem Speichern
- Blockierung kollidierender Aktionen

Drag-and-drop wird auf Ebene der Angular-Logik getestet. Eine reale Pointer- oder Touch-Geste mit tatsächlicher Browsergeometrie kann jsdom nicht vollständig simulieren.

### Statische Seiten

```text
src/app/features/legal/privacy-policy/privacy-policy.spec.ts
src/app/features/legal/legal-notice/legal-notice.spec.ts
src/app/features/help/pages/help/help.spec.ts
```

Diese Tests sichern die grundlegende Erzeugung und Darstellung der Seiten sowie wichtige Navigations- und Templatebestandteile.

## Aufbau eines Tests

Ein Test sollte eine klar erkennbare fachliche Aussage besitzen:

```typescript
it('should restore the persisted session only once', async () => {
  // Arrange
  repository.getSession.mockResolvedValue(session);

  // Act
  await service.restoreSession();
  await service.restoreSession();

  // Assert
  expect(repository.getSession).toHaveBeenCalledTimes(1);
});
```

Das verwendete Grundmuster lautet:

```text
Arrange
→ Ausgangszustand und Test-Doubles vorbereiten

Act
→ eine fachliche Aktion ausführen

Assert
→ öffentlich sichtbares Ergebnis prüfen
```

## Services testen

Service-Tests prüfen bevorzugt die öffentliche API:

- Rückgabewerte
- Signals
- berechnete Zustände
- Loading-State
- Error-State
- Repository-Aufrufe
- lokale Updates
- Wiederherstellung nach Fehlern

Private Hilfsmethoden werden nicht direkt getestet, wenn ihr Verhalten bereits über eine öffentliche Methode beobachtbar ist.

Beispiel:

```typescript
expect(service.user()).toEqual(expectedUser);
expect(service.isAuthenticated()).toBe(true);
expect(repository.signIn).toHaveBeenCalledWith(
  email,
  password
);
```

## Komponenten testen

Komponententests verwenden Angular TestBed und prüfen hauptsächlich:

- Erzeugung der Component
- initialen Zustand
- Inputs
- Outputs
- Benutzeraktionen
- Formularzustände
- Service-Aufrufe
- Navigation
- sichtbare Statusinformationen

CSS-Layout wird in jsdom nicht real berechnet. Aussagen über Pixelpositionen, Scrollbereiche oder Breakpoints gehören deshalb nicht in Unit-Tests.

## Test-Doubles

Externe Grenzen werden in Unit-Tests kontrolliert ersetzt.

Dazu gehören insbesondere:

- Supabase-Repository
- Angular Router
- ActivatedRoute
- Services anderer Features
- Browser-APIs
- Timer
- Component-Events

Ein Unit-Test darf nicht von folgenden Faktoren abhängen:

- Netzwerkverbindung
- vorhandener Supabase-Session
- Reihenfolge anderer Tests
- realen Datenbankeinträgen
- lokalem Browserzustand
- Ausführungszeit eines echten Timeouts

## Asynchrone Tests

Asynchrone Aktionen werden vollständig abgewartet:

```typescript
await component.submit();
```

Danach wird der sichtbare Endzustand geprüft:

```typescript
expect(component.isSubmitting()).toBe(false);
expect(component.errorMessage()).toBe('');
```

Ein Test darf nicht bereits enden, während noch ein Promise, Timer oder Observable-Callback offen ist.

## Fehlerpfade

Fehlerzustände sind Teil der regulären Tests.

Beispiele aus dem finalen Lauf:

```text
Board data could not be loaded.
Task was saved, but board relations could not be refreshed.
Subtask could not be updated.
```

Diese Meldungen entstehen in Tests, die absichtlich einen Repository- oder Netzwerkfehler simulieren. Eine Ausgabe über `stderr` bedeutet deshalb nicht automatisch, dass der Test fehlgeschlagen ist.

Entscheidend sind:

- die zugehörige Assertion
- der finale Vitest-Status
- der Exit-Code des Testbefehls

Trotzdem dürfen unerwartete Fehlermeldungen nicht ignoriert werden. Bei einem Review muss geprüft werden, ob eine Ausgabe zum getesteten Fehlerpfad gehört oder auf einen neuen Defekt hinweist.

## Supabase-Warnung im Testlauf

Der finale Testlauf enthält mehrfach die Warnung:

```text
Multiple GoTrueClient instances detected in the same browser context
```

Die Warnung verhindert den erfolgreichen Testlauf nicht. Alle `214` Tests bestehen.

Sie zeigt jedoch, dass während der Tests mehrere Supabase-Auth-Clients innerhalb derselben jsdom-Umgebung erzeugt werden. Das kann durch voneinander getrennte TestBeds und Component-Initialisierungen entstehen.

Die Warnung wird nicht als gelöster Punkt dokumentiert. Bei einer späteren Bereinigung sollte geprüft werden, ob:

- Supabase in allen betroffenen Tests vollständig ersetzt werden kann
- eine gemeinsame Mock-Instanz genügt
- TestBeds konsequent zurückgesetzt werden
- unnötige reale Auth-Client-Initialisierungen vermieden werden können

## Generierte Testartefakte

Während der Test-Kompilierung erscheinen unter anderem Dateien wie:

```text
init-testbed.js
vitest-mock-patch.js
spec-*.js
chunk-*.js
```

Diese Einträge gehören zum erzeugten Testbundle. Sie sind keine zusätzlichen fachlichen Spec-Dateien und werden nicht einzeln dokumentiert oder manuell bearbeitet.

Die maßgeblichen Quelldateien bleiben die vorhandenen `*.spec.ts`-Dateien.

## Was automatisiert geprüft wird

| Bereich | Automatisiert |
| --- | --- |
| Auth-Service-State | ja |
| Auth-Repository-Aufrufe | ja |
| Auth-Mapping | ja |
| Route Guard | ja |
| Formularvalidierung | ja |
| Component-Events | ja |
| Kontakt-Komponenten | ja |
| Add-Task-Komponenten | ja |
| Board-Logik | ja |
| Task-Karten und Task-Dialog | ja |
| Fehlerpfade | ja |
| statische Seiten | grundlegend |
| echtes Supabase-RLS | nein |
| reales E-Mail-Bestätigungsverfahren | nein |
| Browserlayout und SCSS | nein |
| responsive Darstellung | nein |
| echte Touch- und Drag-Gesten | nein |
| vollständige Tastaturführung | nur teilweise |
| Screenreader-Ausgabe | nein |
| visuelle Regression | nein |
| End-to-End-Abläufe | nein |

## Supabase- und RLS-Prüfung

Die Unit-Tests verwenden keine vollständige reale Supabase-Testumgebung.

Folgende Punkte werden deshalb separat geprüft:

- `anon` besitzt keine Tabellenrechte
- `authenticated` besitzt die vorgesehenen CRUD-Rechte
- Profile sind nur lesbar
- Authentifizierte Nutzer können Kontakte und Tasks laden
- Gastnutzer funktionieren über einen echten anonymen Supabase-User
- nicht authentifizierte Requests werden abgewiesen
- Trigger verknüpfen neue Auth-User korrekt mit Kontakten
- Fremdschlüssel und Unique Constraints greifen

Details stehen unter [Datenbank und Sicherheit](../architecture/database-security.md).

## Manuelle Browserprüfung

Nach einem erfolgreichen Testlauf werden mindestens geprüft:

- Login
- Registrierung
- E-Mail-Bestätigung
- Gastzugang
- Logout
- direkte Navigation auf geschützte Routen
- Session-Wiederherstellung nach einem Reload
- Kontakte erstellen, bearbeiten und löschen
- Task erstellen, bearbeiten und löschen
- Subtasks aktualisieren
- Kontakte zu Tasks zuweisen
- Taskstatus per Drag-and-drop ändern
- Taskstatus mobil über das Move-Menü ändern
- Suche und Empty States
- Dialoge öffnen und schließen
- Body-Scroll-Lock
- responsive Layouts
- Tastaturbedienung
- Browserkonsole
- Asset-404-Fehler

## Responsive Prüfung

Die Unit-Tests berechnen keine echte Browsergeometrie.

Deshalb werden manuell mindestens geprüft:

```text
320px
360px
375px
428px
480px
640px
768px
798px
799px
800px
960px
1024px
1120px
1121px
1280px
1440px
1920px
```

Zusätzlich:

- Smartphone Landscape
- Tablet Landscape
- geringe Viewporthöhe
- lange Inhalte
- leere Listen
- vollständig gefüllte Listen
- geöffnete Dialoge und Dropdowns
- Browserzoom

## Accessibility-Prüfung

Automatisierte Component-Tests decken nur einzelne semantische und tastaturbezogene Abläufe ab.

Manuell geprüft werden unter anderem:

- sichtbare Fokuszustände
- Bedienung mit Tab
- Aktivierung mit Enter und Leertaste
- Schließen vorhandener Menüs mit Escape
- Labels und zugängliche Namen
- Dialogüberschriften
- Fehlertexte
- Navigation ohne Maus
- alternative Taskverschiebung ohne Drag

Eine vollständige WCAG-Konformität oder ein vollständiger Screenreader-Test ist für den finalen Stand nicht dokumentiert.

Details stehen unter [Styling und Barrierefreiheit](styling-accessibility.md).

## Wann ein neuer Test erforderlich ist

Ein neuer Test wird ergänzt, wenn:

- ein fachlicher Fehler behoben wird
- eine neue öffentliche Service-Methode entsteht
- ein neuer Signal-State eingeführt wird
- Validierungsregeln verändert werden
- eine Route oder Guard-Regel geändert wird
- ein Fehlerpfad neu hinzukommt
- eine Component neue Inputs oder Outputs erhält
- Persistenz- oder Sortierlogik verändert wird
- eine bereits getestete Regression erneut möglich wäre

Ein reiner SCSS-Fix benötigt normalerweise keinen Unit-Test. Er benötigt stattdessen eine gezielte visuelle und responsive Prüfung.

## Anforderungen an neue Tests

Neue Tests sollen:

- unabhängig voneinander laufen
- keine echte Netzwerkverbindung benötigen
- den fachlichen Zweck im Namen nennen
- nur einen klaren Ablauf prüfen
- Testdaten lokal erzeugen
- externe Abhängigkeiten kontrollieren
- asynchrone Aktionen vollständig abwarten
- öffentliche Ergebnisse statt privater Implementierung prüfen
- Fehlerpfade berücksichtigen
- nach einem Refactoring weiterhin verständlich bleiben

## Häufige Fehler vermeiden

- nur den erfolgreichen Standardfall testen
- echte Supabase-Anfragen aus Unit-Tests senden
- private Methoden direkt testen
- Testreihenfolge voraussetzen
- gemeinsam veränderte globale Testdaten verwenden
- Promises nicht abwarten
- Timer offen lassen
- ausschließlich prüfen, ob eine Component erzeugt wurde
- CSS-Layout aus jsdom ableiten
- erwartete `stderr`-Ausgaben ungeprüft ignorieren
- einen erfolgreichen Testlauf mit vollständiger Abdeckung gleichsetzen
- bestehende Tests ändern, nur damit eine fehlerhafte Implementierung wieder grün wird
- RLS-Sicherheit allein aus Frontendtests ableiten

## Review-Checkliste

Vor einem Pull Request:

```text
[ ] Alle Tests laufen mit --watch=false
[ ] 214 bestehende Tests bleiben erfolgreich
[ ] Neue Logik besitzt passende neue Tests
[ ] Kein Test benötigt eine Netzwerkverbindung
[ ] Fehlerpfade sind berücksichtigt
[ ] Keine unerwarteten stderr-Ausgaben
[ ] npm run build ist erfolgreich
[ ] git diff --check ist sauber
[ ] Browserkonsole enthält keine neuen Fehler
[ ] Manuelle Prüfung der geänderten Oberfläche ist abgeschlossen
```

Die feste Zahl `214` beschreibt den final dokumentierten Ausgangsstand. Sobald neue fachliche Tests hinzukommen, muss die Checkliste entsprechend aktualisiert werden.

## Grenzen des aktuellen Testaufbaus

Der finale Teststand ist für ein Ausbildungs- und Gruppenprojekt umfangreich, aber nicht vollständig.

Nicht vorhanden sind:

1. vollständige End-to-End-Tests
2. automatisierte Tests gegen eine isolierte Supabase-Testdatenbank
3. automatisierte RLS-Regressionstests
4. visuelle Snapshot- oder Screenshot-Tests
5. vollständige Browser- und Geräteprüfung
6. vollständiger Accessibility-Audit
7. dokumentierter Coverage-Prozentsatz
8. Performance- und Lasttests
9. automatisierte Prüfung realer E-Mail-Bestätigungen
10. vollständige reale Pointer- und Touch-Tests für Drag-and-drop

Diese Grenzen werden nicht durch die Anzahl bestandener Unit-Tests verdeckt.

## Empfohlene Weiterentwicklung

Eine sinnvolle spätere Reihenfolge ist:

1. Testwarnungen durch mehrfach erzeugte GoTrue-Clients bereinigen
2. Coverage-Bericht ergänzen
3. Supabase-Testprojekt oder lokale Testumgebung einrichten
4. RLS-Policies automatisiert prüfen
5. zentrale Auth- und CRUD-Abläufe als End-to-End-Tests abbilden
6. Accessibility-Tests mit Axe ergänzen
7. kritische responsive Ansichten per Screenshot testen
8. Drag-and-drop in einem echten Browser testen

## Weiterführende Dokumentation

- [Anwendungsarchitektur](../architecture/application.md)
- [Datenbank und Sicherheit](../architecture/database-security.md)
- [Authentifizierung und Routing](../architecture/authentication-routing.md)
- [Kontakte](../features/contacts.md)
- [Tasks und Board](../features/tasks-board.md)
- [Formulare und Validierung](../features/forms-validation.md)
- [Code-Konventionen](conventions.md)
- [State- und Fehlerbehandlung](state-error-handling.md)
- [Styling und Barrierefreiheit](styling-accessibility.md)
- [Entwicklungsworkflow](../operations/development-workflow.md)