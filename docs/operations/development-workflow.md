# Entwicklungsworkflow

Dieses Dokument beschreibt den gemeinsamen Entwicklungs-, Git- und Reviewprozess des Join-Projekts.

## Ziel des Workflows

Der Workflow soll sicherstellen, dass:

- alle Teammitglieder auf einem nachvollziehbaren Stand arbeiten
- Änderungen kontrolliert in `main` gelangen
- Konflikte früh erkannt werden
- Reviews verbindlich stattfinden
- Konfigurationsänderungen abgesprochen werden
- Tests und Build vor einem Merge erfolgreich sind
- Commits fachlich verständlich und überprüfbar bleiben

## Technische Grundlage

Das Projekt verwendet:

| Bereich | Werkzeug |
| --- | --- |
| Frontend | Angular und TypeScript |
| Styling | SCSS |
| Backend | Supabase |
| Datenbank | PostgreSQL über Supabase |
| Authentifizierung | Supabase Auth |
| Versionsverwaltung | Git |
| Repository und Pull Requests | GitHub |
| Aufgabenplanung | Trello |
| Entwicklung | VS Code und integriertes Terminal |
| Unit-Tests | Angular Test Runner, Vitest und jsdom |

Angular wird als clientseitige Single-Page-Application verwendet. SSR und SSG sind für Join nicht aktiviert.

## Branch-Struktur

Das Projekt verwendet folgende grundlegende Branch-Struktur:

```text
main
├── Basti
├── Kevin
├── Oliver
└── Nico
```

Dabei gilt:

- `main` ist der gemeinsame produktive Branch.
- Jedes Teammitglied arbeitet auf seinem eigenen Entwicklungsbranch.
- Änderungen werden nicht unkontrolliert direkt auf `main` entwickelt.
- Das Zusammenführen in `main` wird im Daily abgestimmt.
- Nach einem Merge müssen die Entwicklungsbranches wieder auf den gemeinsamen Stand gebracht werden.

Die tatsächlichen Branch-Namen werden mit folgendem Befehl kontrolliert:

```bash
git branch --show-current
git branch -a
```

## Arbeitsbeginn

Vor jedem Arbeitsbeginn wird geprüft, ob der richtige Branch aktiv ist.

```bash
git switch <dein-branch>
git pull origin <dein-branch>
git status
```

Beispiel:

```bash
git switch Basti
git pull origin Basti
git status
```

Vor der Bearbeitung muss `git status` verständlich sein. Bereits vorhandene Änderungen dürfen nicht ungeprüft überschrieben oder mit einer neuen Aufgabe vermischt werden.

## Stand nach einem Daily übernehmen

Nach einem Merge in `main` müssen alle Teammitglieder den neuen gemeinsamen Stand übernehmen.

Zuerst werden die Remote-Informationen aktualisiert:

```bash
git fetch origin
```

Anschließend wird der im Daily vereinbarte Abgleich durchgeführt.

Eine mögliche Variante ist:

```bash
git switch <dein-branch>
git merge origin/main
```

Danach:

```bash
git status
npm install
npm test -- --watch=false
npm run build
```

`npm install` ist insbesondere erforderlich, wenn sich `package.json` oder `package-lock.json` geändert haben.

Ein Rebase oder Force-Push wird nicht ohne Absprache verwendet. Bei gemeinsam genutzten Branches kann dadurch bereits veröffentlichte Historie überschrieben werden.

## Aufgabenplanung

Die fachliche Aufgabenplanung erfolgt über das gemeinsame Trello-Board.

Dabei gelten folgende Teamregeln:

- Nicht mehr als zwei Tasks gleichzeitig bearbeiten.
- Tasks nicht ohne Absprache anderen Personen wegnehmen.
- Tasks nicht unkommentiert zwischen Spalten verschieben.
- Änderungen an der Grundstruktur vorher abstimmen.
- Abhängigkeiten zu anderen Tasks im Daily ansprechen.
- Blockaden früh mitteilen.
- Fertige Aufgaben erst nach eigener Prüfung in den Review geben.

Ein Task gilt nicht allein deshalb als abgeschlossen, weil der Code lokal funktioniert.

## Änderungen vor der Bearbeitung prüfen

Vor einer größeren Änderung werden mindestens folgende Punkte geklärt:

```text
Welche Component oder welcher Service ist zuständig?
Gibt es bereits eine passende Lösung?
Betrifft die Änderung andere Features?
Werden Models, Mapper oder Repositories verändert?
Ist eine Datenbankmigration erforderlich?
Werden Konfigurationsdateien verändert?
Sind neue Assets oder Abhängigkeiten nötig?
Welche Tests müssen angepasst oder ergänzt werden?
```

Lokale Fehler werden möglichst lokal gelöst. Ein Component-Problem ist kein ausreichender Grund, ungeprüft globale Styles, zentrale Services oder die Projektstruktur zu verändern.

## Konfigurationsdateien

Konfigurationsdateien werden nur nach Teamabsprache verändert.

Dazu gehören insbesondere:

```text
angular.json
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.spec.json
.gitignore
zentrale Environment-Vorlagen
globale Styles und zentrale SCSS-Tokens
Supabase-Migrationen und Sicherheitsregeln
```

Vor einem Commit wird geprüft:

```bash
git diff -- angular.json
git diff -- package.json
git diff -- package-lock.json
git diff -- tsconfig.json
git diff -- tsconfig.app.json
git diff -- tsconfig.spec.json
```

Eine automatisch erzeugte Änderung wird nicht allein deshalb übernommen, weil sie von Angular oder npm stammt.

## Environment-Dateien

Environment-Dateien mit echten Supabase-Werten bleiben lokal.

Nicht committen:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Als Vorlage erlaubt:

```text
src/environments/environment.example.ts
```

Beispiel:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Im Angular-Frontend ist ausschließlich der öffentliche Supabase-Key erlaubt:

```text
anon public key
```

Nicht erlaubt:

```text
service_role key
```

Der `service_role`-Key darf niemals in:

- Angular
- GitHub
- einem Browser-Bundle
- einer veröffentlichten Demo
- einem Screenshot
- einer Dokumentation mit echtem Wert

gespeichert werden.

Details stehen unter [Build und Deployment](deployment.md) und [Datenbank und Sicherheit](../architecture/database-security.md).

## Abhängigkeiten installieren

Nach dem Klonen oder nach Änderungen an den Paketdateien:

```bash
npm install
```

Für einen reproduzierbaren Prüf- oder Deploymentlauf mit vorhandenem Lockfile:

```bash
npm ci
```

Neue Pakete werden nur ergänzt, wenn:

- die Aufgabe sie tatsächlich benötigt
- Angular keine eingebaute Lösung besitzt
- die Größe und Wartung vertretbar sind
- das Team der Änderung zugestimmt hat
- `package.json` und `package-lock.json` gemeinsam committed werden

Vor einer Installation wird geprüft, ob Angular die benötigte Funktion bereits bereitstellt.

## Anwendung starten

Entwicklungsserver:

```bash
npm start
```

Der definierte Startbefehl verwendet:

```text
ng serve -o
```

Alternativ:

```bash
ng serve
```

Die lokale URL wird von Angular im Terminal ausgegeben.

Während der Entwicklung werden mindestens geprüft:

- Browserkonsole
- Netzwerkfehler
- Asset-404
- Supabase-Requests
- Routing
- responsive Darstellung
- Tastaturbedienung der geänderten Oberfläche

## Aktuellen Git-Stand prüfen

Vor dem Staging:

```bash
git status --short
git diff --name-status
git diff
```

Bereits gestagte Dateien:

```bash
git diff --cached --name-status
git diff --cached
```

Diese Befehle zeigen:

- neue Dateien
- geänderte Dateien
- gelöschte Dateien
- bereits gestagte Änderungen
- unbeabsichtigte Formatierungsänderungen
- mögliche Vermischung mehrerer Aufgaben

## Änderungen fachlich gruppieren

Commits werden nach fachlicher Zugehörigkeit gruppiert.

Geeignete Gruppen sind beispielsweise:

```text
Auth-Domain und Mapper
Auth-Repository und Service
Kontaktformular und Validierung
Task-Persistenz und State
Board-Interaktion
Responsive Styling
Assets und zugehörige Templateänderungen
Unit-Tests
Dokumentation
```

Nicht geeignet ist ein einzelner Sammelcommit wie:

```text
update files
```

wenn darin voneinander unabhängige Features, Konfigurationsänderungen und Dokumentation vermischt sind.

Assets werden zusammen mit der Änderung committed, die sie tatsächlich verwendet.

## Dateien stagen

Einzelne fachliche Gruppe:

```bash
git add <datei-1> <datei-2> <datei-3>
```

Gestagten Umfang prüfen:

```bash
git diff --cached --name-status
git diff --cached
```

Falls eine Datei versehentlich gestagt wurde:

```bash
git restore --staged <datei>
```

Dabei wird die lokale Änderung nicht gelöscht. Sie wird nur aus dem aktuellen Staging-Bereich entfernt.

## Commit-Konvention

Commit-Nachrichten verwenden einen klaren Typ und möglichst einen fachlichen Scope.

Verwendete Typen:

| Typ | Zweck |
| --- | --- |
| `feat` | neue fachliche Funktion |
| `fix` | Fehlerbehebung |
| `refactor` | Umstrukturierung ohne beabsichtigte Funktionsänderung |
| `test` | neue oder geänderte Tests |
| `docs` | Dokumentation |
| `style` | reine Formatierung oder visuelle Änderung |
| `chore` | technische Wartungsarbeit |
| `build` | Build- oder Paketkonfiguration |

Beispiele:

```text
feat(auth): add authentication state service
fix(board): persist task order after status change
feat(contacts): expose authenticated user relation
test(auth): cover sign-up and sign-in
docs(operations): document deployment workflow
style(add-task): align assigned contacts dropdown
```

Die Nachricht beschreibt die Änderung, nicht den persönlichen Arbeitsvorgang.

Ungeeignet:

```text
worked on board
changes
fix stuff
final
update
```

## Commit erstellen

Nach der Kontrolle des Staging-Bereichs:

```bash
git commit -m "feat(auth): add authentication state service"
```

Danach:

```bash
git status
git log -1 --oneline
```

Ein Commit sollte:

- fachlich abgeschlossen sein
- kompilierbaren Code enthalten
- keine echten Secrets enthalten
- keine zufälligen Debug-Ausgaben enthalten
- keine unabhängigen Änderungen vermischen
- eine nachvollziehbare Nachricht besitzen

## Branch pushen

Der eigene Entwicklungsbranch wird mit seinem Remote-Branch synchronisiert:

```bash
git push origin <dein-branch>
```

Beim ersten Push eines neuen Branches:

```bash
git push -u origin <dein-branch>
```

Ein Force-Push wird nicht ohne ausdrückliche Teamabsprache verwendet.

## Pull Request

Änderungen gelangen über einen Pull Request vom Entwicklungsbranch nach `main`.

Der Pull Request enthält mindestens:

```text
Titel
kurze fachliche Zusammenfassung
betroffene Features
wichtige technische Entscheidungen
durchgeführte Tests
bekannte Warnungen oder Grenzen
Hinweise zu Migrationen oder Konfiguration
Screenshots bei sichtbaren UI-Änderungen
```

Beispiel:

```markdown
## Summary

- add authenticated session restoration
- connect login and guest access to Supabase Auth
- expose request and error states through signals

## Verification

- npm test -- --watch=false
- npm run build
- git diff --check
- manual login and guest-login test
```

## Reviewprozess

Reviews sind verpflichtend.

Im Projekt gilt das 6-Augen-Prinzip:

```text
Umsetzung
    ↓
First Check
    ↓
Second Check
    ↓
gemeinsame Merge-Entscheidung
```

Jedes Teammitglied soll regelmäßig Zeit für Reviews einplanen. Als Richtwert wurden etwa 30 Minuten pro Tag vereinbart.

Ein Review prüft nicht nur, ob der Code kompiliert.

Geprüft werden unter anderem:

- fachliches Verhalten
- Verständlichkeit
- Zuständigkeiten
- Wiederverwendung vorhandener Strukturen
- Fehlerbehandlung
- Loading- und Disabled-State
- Validierung
- responsive Darstellung
- Barrierefreiheit
- Tests
- Build
- unerwünschte Nebeneffekte
- Datenbankzugriffe
- Sicherheitsauswirkungen
- Dokumentation

## Reviewkommentare bearbeiten

Ein Reviewkommentar wird nicht nur lokal beantwortet, sondern eindeutig behandelt.

Mögliche Ergebnisse:

```text
Änderung umgesetzt
mit Begründung nicht umgesetzt
Rückfrage gestellt
als spätere Aufgabe dokumentiert
```

Nach einer Änderung werden die betroffenen Prüfungen erneut ausgeführt.

Ein bereits bestandener Testlauf vor dem Review reicht nicht aus, wenn danach Code verändert wurde.

## Merge in `main`

Der Merge in `main` wird im Daily besprochen.

Vor dem Merge muss geklärt sein:

- welche Pull Requests aufgenommen werden
- ob Abhängigkeiten zwischen Pull Requests bestehen
- ob Migrationen notwendig sind
- ob Konfigurationsdateien betroffen sind
- ob Tests und Build erfolgreich sind
- ob noch Reviewkommentare offen sind
- ob bekannte Warnungen akzeptiert oder vorher behoben werden

Unabgesprochene direkte Änderungen auf `main` werden vermieden.

Nach dem Merge wird kontrolliert:

```bash
git switch main
git pull origin main
npm install
npm test -- --watch=false
npm run build
```

Danach übernehmen die Teammitglieder den neuen Stand in ihre Entwicklungsbranches.

## Konflikte

Merge-Konflikte werden nicht blind durch Auswahl einer gesamten Dateiseite gelöst.

Vor der Auflösung wird geprüft:

```text
Welche Änderung stammt aus main?
Welche Änderung stammt aus dem Featurebranch?
Sind beide Änderungen weiterhin erforderlich?
Hat sich die zuständige Component inzwischen strukturell geändert?
Sind Imports, Tests oder Styles voneinander abhängig?
```

Nach der Konfliktauflösung:

```bash
git status
git diff --check
npm test -- --watch=false
npm run build
```

Besondere Vorsicht gilt bei:

- `package.json`
- `package-lock.json`
- `angular.json`
- Routing
- zentralen Services
- Models
- Supabase-Migrationen
- globalen Styles
- gemeinsam bearbeiteten Templates

## Tests

Vollständiger einmaliger Testlauf:

```bash
npm test -- --watch=false
```

Alternativ:

```bash
ng test --watch=false
```

Der final dokumentierte Ausgangsstand umfasst:

```text
214 von 214 erfolgreichen Tests
```

Diese Zahl muss angepasst werden, sobald weitere Tests hinzukommen.

Ein erfolgreicher Unit-Testlauf ersetzt nicht:

- manuelle Browserprüfung
- responsive Prüfung
- echte Supabase-Prüfung
- RLS-Prüfung
- Screenreader-Test
- reale Drag-and-drop-Prüfung

Details stehen unter [Tests](../engineering/testing.md).

## Produktions-Build

Build ausführen:

```bash
npm run build
```

Ein erfolgreicher Build bedeutet:

- TypeScript wurde kompiliert
- Angular konnte die Templates verarbeiten
- die definierten Error-Budgets wurden nicht überschritten
- das Browser-Bundle wurde erzeugt

Warnungen werden trotzdem geprüft.

Insbesondere relevant sind:

- ungenutzte Standalone-Imports
- Bundle-Budgetwarnungen
- Component-Style-Budgetwarnungen
- veraltete APIs
- fehlende Assets
- fehlerhafte Environment-Konfiguration

Details stehen unter [Build und Deployment](deployment.md).

## Whitespace- und Diff-Prüfung

Vor einem Pull Request:

```bash
git diff --check
```

Der Befehl erkennt unter anderem:

- nachgestellte Leerzeichen
- problematische Leerzeilen
- bestimmte Whitespace-Fehler

Anschließend:

```bash
git status --short
```

Die Ausgabe muss vollständig verstanden werden. Unbekannte Dateien werden nicht ungeprüft committed.

## Vollständige technische Prüfung

Vor Review, Pull Request oder Merge:

```bash
npm test -- --watch=false
npm run build
git diff --check
git status --short
```

Zusätzlich manuell:

```text
Browserkonsole ohne neue Fehler
keine Asset-404
kein ungewollter horizontaler Page-Scroll
geänderte Route direkt erreichbar
Reload auf geschützter Route geprüft
Formularfehler geprüft
Loading- und Disabled-State geprüft
mobile Ansicht geprüft
Desktopansicht geprüft
Tastaturbedienung geprüft
```

## Definition of Done

Eine Aufgabe ist fertig, wenn:

```text
[ ] Akzeptanzkriterien sind erfüllt
[ ] fachliche Funktion wurde manuell geprüft
[ ] Fehlerpfade wurden berücksichtigt
[ ] Loading- und Disabled-Zustände funktionieren
[ ] relevante Tests bestehen
[ ] neue Logik besitzt passende Tests
[ ] Produktions-Build ist erfolgreich
[ ] git diff --check ist sauber
[ ] Browserkonsole enthält keine neuen Fehler
[ ] responsive Darstellung wurde geprüft
[ ] Tastaturbedienung wurde geprüft
[ ] keine echten Secrets wurden committed
[ ] notwendige Dokumentation wurde aktualisiert
[ ] Pull Request wurde geprüft
[ ] offene Grenzen sind dokumentiert
```

## Styling-Änderungen

Bei einer SCSS-Änderung werden mindestens geprüft:

- Standardzustand
- Hover
- `:focus-visible`
- Active oder Selected
- Disabled
- Error
- lange Inhalte
- kleinster relevanter Viewport
- Desktop
- Landscape bei geringer Höhe

Ein lokaler Darstellungsfehler wird nicht vorschnell durch einen globalen Selektor gelöst.

Eine reine SCSS-Änderung benötigt normalerweise keinen Unit-Test. Sie benötigt aber eine gezielte visuelle und responsive Prüfung.

Details stehen unter [Styling und Barrierefreiheit](../engineering/styling-accessibility.md).

## Datenbankänderungen

Eine Datenbankänderung wird als versionierte SQL-Migration dokumentiert.

Dabei müssen mindestens erkennbar sein:

- neue oder geänderte Tabelle
- Spalten
- Datentypen
- Fremdschlüssel
- Unique Constraints
- Indizes
- Trigger
- Grants
- RLS-Policies
- notwendige Bestandsdatenmigration

Änderungen nur in der Supabase-Weboberfläche reichen nicht als nachvollziehbare Projektdokumentation.

Frontendcode und Datenbankmigration müssen gemeinsam betrachtet werden. Ein Frontend-Merge darf nicht davon ausgehen, dass eine nicht dokumentierte Datenbankänderung bereits überall vorhanden ist.

Details stehen unter [Datenbank und Sicherheit](../architecture/database-security.md).

## Dokumentationsänderungen

Dokumentation wird aktualisiert, wenn sich verändert:

- Architektur
- Routing
- Authentifizierung
- Datenmodell
- RLS
- Service-API
- Formularvalidierung
- Testaufbau
- Build
- Deployment
- Teamworkflow

Dokumentationsaussagen werden gegen den finalen Code geprüft. Geplante oder nur teilweise umgesetzte Funktionen werden nicht als fertig beschrieben.

## Debug-Ausgaben

Temporäre Ausgaben dürfen während der Entwicklung verwendet werden, wenn sie die Fehlersuche unterstützen.

Vor einem Pull Request werden sie geprüft:

```bash
git diff | grep "console"
```

Nicht jede Konsolenausgabe ist automatisch falsch. Unerwartete Debug-Ausgaben, personenbezogene Daten, Sessions oder technische Supabase-Objekte gehören jedoch nicht in den finalen Browserbetrieb.

## Umgang mit Fehlern

Bei einem Fehler wird zuerst der tatsächliche Zustand gesichert:

```bash
git status --short
git diff --name-status
git diff
```

Danach werden mindestens geprüft:

```text
Browserkonsole
Netzwerk-Tab
Angular-Terminal
betroffene Signals
Service-State
Repository-Rückgabe
Supabase-Fehler
Route und Query-Parameter
Formularstatus
```

Eine Fehlermeldung wird nicht durch Entfernen der Prüfung oder Abschalten des Tests „behoben“.

## Häufige Fehler vermeiden

- auf dem falschen Branch arbeiten
- vor Arbeitsbeginn nicht pullen
- nach einem Daily mit altem Stand weiterarbeiten
- direkt und unabgesprochen auf `main` entwickeln
- mehrere unabhängige Aufgaben in einem Commit mischen
- Konfigurationsdateien ohne Absprache ändern
- `package-lock.json` ungeprüft überschreiben
- echte Environment-Werte committen
- den `service_role`-Key im Frontend verwenden
- Force-Push ohne Teamabsprache
- Konflikte blind durch Übernahme einer gesamten Dateiseite lösen
- Tests nach Reviewänderungen nicht erneut ausführen
- einen erfolgreichen Build mit vollständiger Funktionsprüfung gleichsetzen
- Warnungen ungeprüft ignorieren
- SCSS-Probleme durch unkontrollierte globale Regeln lösen
- Dokumentation über Funktionen schreiben, die nicht final umgesetzt sind
- Tasks anderer Teammitglieder ohne Absprache übernehmen
- mehr als zwei Tasks gleichzeitig beginnen
- Pull Requests ohne nachvollziehbare Beschreibung erstellen

## Tagesabschluss

Vor dem Ende eines Arbeitstages:

```bash
git status --short
git diff --name-status
```

Falls die Aufgabe commitfähig ist:

```bash
git add <fachlich-zusammengehörige-dateien>
git diff --cached --name-status
git diff --cached
git commit -m "<type>(<scope>): <beschreibung>"
git push origin <dein-branch>
```

Danach werden für das Daily notiert:

```text
Was wurde fertiggestellt?
Was ist noch offen?
Welche Tests wurden ausgeführt?
Gibt es Warnungen?
Gibt es Konflikte oder Abhängigkeiten?
Muss etwas im Team entschieden werden?
```

## Daily-Checkliste

```text
[ ] alle relevanten Branches wurden aktualisiert
[ ] offene Pull Requests wurden benannt
[ ] Reviews wurden zugeordnet
[ ] Merge-Reihenfolge wurde geklärt
[ ] Konflikte wurden angesprochen
[ ] Konfigurationsänderungen wurden erklärt
[ ] Datenbankmigrationen wurden erklärt
[ ] Blockaden wurden benannt
[ ] Aufgaben im Trello-Board sind aktuell
[ ] alle arbeiten nach dem Merge wieder auf demselben Stand
```

## Weiterführende Dokumentation

- [Anwendungsarchitektur](../architecture/application.md)
- [Datenbank und Sicherheit](../architecture/database-security.md)
- [Authentifizierung und Routing](../architecture/authentication-routing.md)
- [Kontakte](../features/contacts.md)
- [Tasks und Board](../features/tasks-board.md)
- [Formulare und Validierung](../features/forms-validation.md)
- [Code-Konventionen](../engineering/conventions.md)
- [State- und Fehlerbehandlung](../engineering/state-error-handling.md)
- [Styling und Barrierefreiheit](../engineering/styling-accessibility.md)
- [Tests](../engineering/testing.md)
- [Build und Deployment](deployment.md)