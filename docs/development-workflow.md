# Development Workflow

Dieses Dokument beschreibt den Entwicklungsworkflow im Join-Projekt. Ziel ist, dass alle Teammitglieder sauber auf ihren Branches arbeiten, Änderungen nachvollziehbar bleiben und Merges kontrolliert im Team passieren.

---

## Grundregel

Jedes Teammitglied arbeitet auf dem eigenen Branch.

```text
main
→ gemeinsamer stabiler Stand

eigener Branch
→ Entwicklung pro Person
```

In `main` wird nicht direkt gearbeitet.

---

## Branch-Struktur

Empfohlene Branches:

```text
main
Basti
Kevin
Nico
Oliver
```

Der `main`-Branch ist der gemeinsame Referenzstand.

Persönliche Branches werden für Entwicklung, Tests und Pull Requests genutzt.

---

## Vor Arbeitsbeginn

Vor jeder Arbeit am Projekt zuerst den aktuellen Stand holen.

```bash
git switch <dein-branch>
git pull origin <dein-branch>
```

Wenn nach dem Daily `main` aktualisiert wurde, den eigenen Branch ebenfalls aktualisieren.

```bash
git fetch origin
git switch <dein-branch>
git pull origin <dein-branch>
```

Falls im Team vereinbart, zusätzlich Änderungen aus `main` übernehmen:

```bash
git merge origin/main
```

Merges aus `main` in persönliche Branches sollten im Team abgestimmt werden.

---

## Während der Arbeit

Änderungen möglichst klein und nachvollziehbar halten.

Nicht mehrere große Themen in einem Commit mischen.

Gut:

```text
TaskService dokumentieren
ContactDialog Styling fixen
Board Cards anzeigen
```

Schlecht:

```text
TaskService, Sidebar, README, Dialog, Datenbank und Layout in einem Commit
```

---

## Status prüfen

Während der Arbeit regelmäßig prüfen:

```bash
git status --short
```

Das zeigt, welche Dateien geändert wurden.

Vor einem Commit sollte klar sein:

```text
Welche Dateien wurden geändert?
Warum wurden sie geändert?
Gehören alle Änderungen zur aktuellen Aufgabe?
Sind ungewollte Dateien dabei?
```

---

## Build prüfen

Vor einem Commit oder spätestens vor dem Pull Request:

```bash
npm run build
```

Der Build muss erfolgreich sein.

Build-Warnungen werden bewertet.  
Build-Fehler müssen vor Review behoben werden.

---

## Whitespace prüfen

Vor dem Commit:

```bash
git diff --check
```

Erwartung:

```text
keine Ausgabe
```

Wenn hier Fehler erscheinen, müssen sie vor dem Commit behoben werden.

---

## Konfliktmarker prüfen

Nach Pulls, Merges oder Konflikten:

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Erwartung:

```text
keine Ausgabe
```

Konfliktmarker dürfen niemals committed werden.

---

## Commit vorbereiten

Nur Dateien stagen, die wirklich zur Aufgabe gehören.

```bash
git add <datei>
```

Beispiel:

```bash
git add docs/task-service.md
```

Nicht blind alles stagen, wenn unklar ist, was geändert wurde.

Nur bewusst verwenden:

```bash
git add .
```

---

## Commit-Format

Commits verwenden dieses Format:

```text
type(scope): message
```

Beispiele:

```text
feat(tasks): add task create flow
fix(contacts): keep selected contact after update
docs(tasks): document task service data flow
style(layout): align responsive sidebar
refactor(tasks): extract task payload mapper
```

---

## Commit-Typen

| Typ | Verwendung |
|---|---|
| `feat` | neues Feature |
| `fix` | Fehlerbehebung |
| `docs` | Dokumentation |
| `style` | Styling ohne Logikänderung |
| `refactor` | Umbau ohne neues Verhalten |
| `test` | Tests oder Testdaten |
| `chore` | Setup, Config, kleine Wartung |

---

## Gute Commit-Messages

Gute Messages sind kurz, aber konkret.

Gut:

```text
docs(tasks): document task data layer
fix(contacts): prevent dialog body scroll
feat(board): render task cards by status
refactor(tasks): move task payload mapping
```

Ungünstig:

```text
update
fix
changes
stuff
final
```

Die Message soll später erklären, was geändert wurde.

---

## Push

Nach dem Commit den eigenen Branch pushen.

```bash
git push origin <dein-branch>
```

Beispiel:

```bash
git push origin Basti
```

---

## Pull Requests

Änderungen werden über Pull Requests reviewed.

Ablauf:

```text
eigener Branch
  ↓
Commit
  ↓
Push
  ↓
Pull Request
  ↓
Review
  ↓
Merge nach Absprache
```

Der Pull Request sollte beschreiben:

```text
Was wurde geändert?
Warum wurde es geändert?
Welche Dateien oder Bereiche sind betroffen?
Wie wurde getestet?
Gibt es offene Punkte?
```

---

## Pull-Request-Template

Empfohlener Aufbau:

```md
## Änderungen
- ...

## Betroffene Bereiche
- ...

## Tests
- [ ] npm run build
- [ ] git diff --check
- [ ] relevante User-Flows geprüft

## Hinweise
- ...
```

---

## Reviews

Reviews sind Pflicht.

Geprüft werden:

```text
Funktion
Codequalität
Build
Konsole
Responsive Verhalten, falls UI betroffen ist
Datenbankverhalten, falls Supabase betroffen ist
Dokumentation, falls Architektur oder Nutzung betroffen ist
```

Review-Kommentare werden sachlich bearbeitet.

---

## Merge-Regel

Merges in `main` werden im Daily oder nach Teamabsprache durchgeführt.

Nicht vorgesehen:

```text
ungefragter Merge in main
direktes Arbeiten auf main
Merge ohne Review
Merge mit Build-Fehlern
```

Vorgesehen:

```text
Pull Request
Review
Teamabsprache
Merge
alle ziehen den neuen Stand
```

---

## Nach einem Merge

Nach einem Merge in `main` müssen alle Teammitglieder ihren Stand aktualisieren.

```bash
git fetch origin
git switch main
git pull origin main
```

Danach den eigenen Branch aktualisieren.

```bash
git switch <dein-branch>
git merge main
```

oder nach Teamabsprache:

```bash
git pull origin <dein-branch>
```

Wichtig ist: Nach dem Daily sollen alle auf einem nachvollziehbaren gemeinsamen Stand sein.

---

## Umgang mit Merge-Konflikten

Wenn Konflikte entstehen:

```text
nicht hektisch lösen
betroffene Dateien prüfen
Team informieren, wenn fremder Code betroffen ist
Konflikt sauber auflösen
Build erneut ausführen
Konfliktmarker prüfen
```

Nach dem Lösen:

```bash
git add <gelöste-dateien>
git commit
```

Danach prüfen:

```bash
npm run build
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

---

## Environment-Dateien

Environment-Dateien mit echten Keys werden nicht committed.

Nicht committen:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Erlaubt:

```text
src/environments/environment.example.ts
```

Dort stehen nur Platzhalter.

Beispiel:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Wichtig:

```text
Nur Supabase anon public key verwenden.
Niemals service_role key im Frontend speichern.
```

---

## Config-Dateien

Config-Dateien werden nur nach Absprache geändert.

Dazu zählen:

```text
angular.json
package.json
package-lock.json
tsconfig.json
.gitignore
eslint.config.js
```

Wenn eine Config-Datei geändert wird, muss klar sein:

```text
Warum wurde sie geändert?
Wer ist betroffen?
Muss das Team danach npm install ausführen?
Gibt es Auswirkungen auf Build oder Imports?
```

---

## Datenbankänderungen

Datenbankänderungen müssen im Team angekündigt werden.

Dazu zählen:

```text
neue Tabellen
neue Spalten
Constraints
Foreign Keys
RLS-Policies
Seed-Daten
Änderungen an vorhandenen Daten
```

Nach Datenbankänderungen müssen geprüft werden:

```text
Models
Mapper
Payload-Mapper
Repository
Services
Dokumentation
Testdaten
```

---

## Dokumentation

Dokumentation wird angepasst, wenn sich Architektur, Datenfluss oder Nutzung ändern.

Beispiele:

```text
neue Service-Methode
neue Tabelle
neuer Datenfluss
neues Component-Verhalten
neue Git- oder Review-Regel
```

Doku-Änderungen bekommen eigene Commits, wenn sie umfangreicher sind.

Beispiel:

```text
docs(tasks): document task service integration
```

---

## Daily Workflow

Im Daily wird kurz geklärt:

```text
Was wurde seit dem letzten Daily gemacht?
Was ist gerade in Arbeit?
Was ist blockiert?
Was soll heute gemerged werden?
Welche Pull Requests brauchen Review?
Welche Datenbank- oder Config-Änderungen stehen an?
```

Nach dem Daily sollte klar sein:

```text
wer woran arbeitet
welche Branches aktualisiert werden müssen
welche Aufgaben reviewed werden
welche Änderungen in main landen
```

---

## Trello Workflow

Das Trello-Board wird parallel aktuell gehalten.

Regeln:

```text
Aufgaben nicht ohne Absprache verschieben.
Aufgaben nicht ohne Absprache übernehmen.
Nicht mehr als zwei aktive Aufgaben pro Person.
Blocker sichtbar machen.
Review-Aufgaben in Review verschieben.
```

Details stehen in:

```text
docs/trello-board.md
```

---

## Definition of Done

Eine Aufgabe gilt als erledigt, wenn:

```text
Funktion umgesetzt ist
Akzeptanzkriterien erfüllt sind
Build erfolgreich ist
keine kritischen Konsolenfehler vorhanden sind
relevante User-Flows geprüft wurden
Review abgeschlossen ist
Dokumentation angepasst wurde, falls nötig
```

---

## Vor dem Pull Request prüfen

```bash
npm run build
git diff --check
git status --short
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Zusätzlich manuell prüfen:

```text
betroffene UI-Flows
responsive Verhalten, falls UI betroffen ist
Supabase-Daten nach Reload, falls Daten betroffen sind
Browser-Konsole
```

---

## Vor dem Sprintabschluss prüfen

```text
alle MVP-Flows funktionieren
Build läuft
keine kritischen Bugs offen
keine ungewollten Dateien im Status
Doku ist aktuell
Trello ist aktuell
Reviews sind abgeschlossen
main enthält den abgestimmten Stand
```

---

## Häufige Fehler vermeiden

### Nicht direkt auf main arbeiten

Falsch:

```bash
git switch main
# Code ändern
git commit
```

Richtig:

```bash
git switch <dein-branch>
# Code ändern
git commit
```

---

### Nicht alles ungeprüft committen

Falsch:

```bash
git add .
git commit -m "update"
```

Richtig:

```bash
git status --short
git add <passende-dateien>
git commit -m "docs(tasks): document task service"
```

---

### Keine echten Keys committen

Falsch:

```text
environment.ts mit echtem Supabase Key committen
```

Richtig:

```text
environment.example.ts mit Platzhaltern committen
```

---

### Keine großen Mischcommits

Falsch:

```text
Board, Contacts, README, Supabase und Sidebar in einem Commit
```

Richtig:

```text
kleine fachliche Commits pro Bereich
```

---

### Keine fremden Aufgaben übernehmen

Falsch:

```text
Trello-Karte einer anderen Person ohne Absprache bearbeiten
```

Richtig:

```text
im Daily oder direkt mit der Person abstimmen
```

---

## Nützliche Befehle

### Aktuellen Branch anzeigen

```bash
git branch --show-current
```

### Status anzeigen

```bash
git status --short
```

### Änderungen ansehen

```bash
git diff
```

### Gestagte Änderungen ansehen

```bash
git diff --staged
```

### Letzte Commits anzeigen

```bash
git log --oneline -5
```

### Build ausführen

```bash
npm run build
```

### Whitespace prüfen

```bash
git diff --check
```

### Konfliktmarker suchen

```bash
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

---

## Zusammenfassung

Der Development Workflow sorgt dafür, dass Änderungen nachvollziehbar, reviewbar und teamfähig bleiben.

Jede Person arbeitet auf dem eigenen Branch.  
Commits bleiben klein und konkret.  
Pull Requests werden reviewed.  
Merges in `main` passieren nach Absprache.  
Build, Git-Status und Dokumentation werden vor Reviews geprüft.

So bleibt der Projektstand stabil und für alle Teammitglieder verständlich.