# Deployment und Build

Dieses Dokument beschreibt, wie das Join-Projekt gebaut, geprüft und für eine Demo oder Abgabe vorbereitet wird.

Ziel ist, dass der finale Stand reproduzierbar gebaut werden kann und keine lokalen Entwicklungsdateien oder sensiblen Daten im Repository landen.

---

## Grundregel

Vor jeder Abgabe und vor jedem Merge in den finalen Stand muss der Build erfolgreich sein.

```bash
npm run build
```

Zusätzlich prüfen:

```bash
git diff --check
git status --short
git grep -n "<<<<<<<\|=======\|>>>>>>>"
```

Erwartung:

```text
Build erfolgreich
keine Whitespace-Fehler
keine Konfliktmarker
keine ungewollten Dateien
keine echten Environment-Keys
```

---

## Build ausführen

Der Production-Build wird mit folgendem Befehl erstellt:

```bash
npm run build
```

Alternativ direkt über Angular CLI:

```bash
ng build
```

Der Build erzeugt die fertigen Dateien im `dist`-Ordner.

Der genaue Ausgabeordner hängt vom Projektnamen und der Angular-Konfiguration ab.

Typische Struktur:

```text
dist/
└── join/
    └── browser/
        ├── index.html
        ├── main-....js
        ├── styles-....css
        └── assets/
```

Für Deployment wird der Inhalt des finalen Browser-Ordners hochgeladen.

---

## Was in den Upload gehört

Für statisches Hosting gehört der gebaute Inhalt aus dem Build-Ordner auf den Webserver.

Typisch:

```text
dist/join/browser/
```

Hochgeladen werden:

```text
index.html
JavaScript-Dateien
CSS-Dateien
assets/
favicon
weitere statische Dateien
```

Nicht hochladen:

```text
src/
node_modules/
.git/
docs/
README.md
angular.json
package.json
package-lock.json
lokale Environment-Dateien
```

Der Webserver braucht nur die gebauten Dateien.

---

## Build vor Hosting prüfen

Nach dem Build lokal prüfen:

```bash
npm run build
```

Danach kontrollieren:

```text
dist-Ordner wurde erzeugt
index.html ist vorhanden
main-*.js ist vorhanden
styles-*.css ist vorhanden
assets sind vorhanden
keine Build-Fehler
keine kritischen Warnungen
```

---

## Build-Warnungen

Build-Warnungen müssen bewertet werden.

Beispiele:

```text
Budget überschritten
ungenutzte Imports
SCSS-Warnungen
Asset-Warnungen
```

Warnungen blockieren nicht automatisch die Abgabe, sollten aber verstanden werden.

Bei Budget-Warnungen prüfen:

```text
Sind große Assets eingebunden?
Sind unnötige Libraries enthalten?
Ist der initiale Bundle zu groß?
Ist das für die Projektabgabe akzeptabel?
```

---

## Lokaler Smoke-Test

Nach dem Build sollte die Anwendung lokal oder im Dev-Server geprüft werden.

```bash
npm start
```

Prüfen:

```text
App startet
Routing funktioniert
Contacts laden
Board lädt
Add Task ist erreichbar
Navigation funktioniert
keine Konsolenfehler
keine fehlenden Assets
```

---

## Environment-Dateien

Echte Environment-Dateien werden lokal angelegt und nicht committed.

Nicht committen:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Erlaubt:

```text
src/environments/environment.example.ts
```

Diese Datei enthält nur Platzhalter.

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

---

## Supabase Keys

Im Frontend darf nur der Supabase `anon public key` verwendet werden.

Erlaubt:

```text
anon public key
```

Nicht erlaubt:

```text
service_role key
```

Der `service_role` Key darf niemals in Angular, GitHub, den Browser oder eine Demo-Version gelangen.

---

## Git-Prüfung für Keys

Vor Abgabe prüfen:

```bash
git grep -n "service_role"
git grep -n "supabase"
git grep -n "anon"
```

Wenn echte Keys versehentlich im Repository gelandet sind, reicht Entfernen aus einer Datei nicht immer aus. Dann muss das Team entscheiden, ob der Key in Supabase rotiert werden muss.

---

## `.gitignore`

Die `.gitignore` sollte lokale Environment-Dateien ausschließen.

```gitignore
# Local environment files
src/environments/environment.ts
src/environments/environment.development.ts
```

Eine Beispiel-Datei darf committed werden:

```text
src/environments/environment.example.ts
```

---

## Supabase Demo-Setup

Für die Demo muss Supabase erreichbar sein.

Prüfen:

```text
Supabase-Projekt aktiv
URL korrekt
anon public key korrekt
Tabellen vorhanden
RLS-Policies für Demo passend gesetzt
Seed-Daten vorhanden
Frontend kann lesen und schreiben
```

Wichtige Tabellen:

```text
contacts
tasks
subtasks
task_assignments
```

---

## RLS für Demo

Für die Entwicklungs- und Demo-Phase können Policies offen sein.

Das ist nur für den Projektkontext akzeptabel.

Nicht produktionssicher:

```text
anon darf lesen und schreiben
```

Für Produktion nötig:

```text
Supabase Auth
benutzerbezogene Policies
minimale Rechte
getrennte Demo- und Produktivdaten
```

---

## Datenbank vor Abgabe prüfen

### Kontakte

```sql
select count(*) as contact_count
from public.contacts;
```

### Tasks pro Status

```sql
select
  status,
  count(*) as task_count
from public.tasks
group by status
order by status;
```

### Subtasks

```sql
select
  count(*) as subtask_count,
  count(*) filter (
    where is_completed = true
  ) as completed_subtask_count
from public.subtasks;
```

### Kontaktzuweisungen

```sql
select count(*) as assignment_count
from public.task_assignments;
```

---

## Verwaiste Daten prüfen

### Verwaiste Subtasks

```sql
select subtasks.*
from public.subtasks
left join public.tasks
  on tasks.id = subtasks.task_id
where tasks.id is null;
```

Erwartung:

```text
keine Zeilen
```

### Verwaiste Kontaktzuweisungen

```sql
select task_assignments.*
from public.task_assignments
left join public.tasks
  on tasks.id = task_assignments.task_id
left join public.contacts
  on contacts.id = task_assignments.contact_id
where tasks.id is null
   or contacts.id is null;
```

Erwartung:

```text
keine Zeilen
```

---

## Routing beim Hosting

Angular ist eine Single-Page-Anwendung.

Das bedeutet:

```text
/board
/contacts
/add-task
```

werden im Browser durch Angular geroutet.

Auf einem statischen Webserver muss ein Reload auf diesen Routen trotzdem funktionieren.

---

## SPA-Fallback

Wenn der Server direkte Routen nicht kennt, kann ein Reload auf `/board` zu einem 404 führen.

Für Apache-Hosting kann eine `.htaccess` mit SPA-Fallback helfen.

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Diese Datei gehört in den Hosting-Ordner neben die `index.html`, wenn der Server Apache-Rewrites unterstützt.

---

## Deployment im Domain-Root

Wenn die App direkt unter der Domain liegt:

```text
https://example.com/
```

kann normalerweise ohne spezielles `base-href` gebaut werden.

```bash
npm run build
```

Danach den Inhalt des Browser-Build-Ordners in den Webroot hochladen.

---

## Deployment in Unterordner

Wenn die App in einem Unterordner liegt:

```text
https://example.com/join/
```

muss der `base-href` passen.

Beispiel:

```bash
ng build --configuration production --base-href /join/
```

Dann den Build-Inhalt in den passenden Unterordner hochladen.

Nach dem Upload prüfen:

```text
Startseite lädt
Assets laden
Routing funktioniert
Reload auf Unterroute funktioniert
```

---

## Asset-Pfade

Assets werden im Code so referenziert:

```text
assets/...
```

Beispiel:

```html
<img src="assets/icons/close.svg" alt="" />
```

Dateien liegen im Projekt unter:

```text
public/assets/...
```

Nicht verwenden:

```html
<img src="./assets/icons/close.svg" />
<img src="public/assets/icons/close.svg" />
<img src="assets\icons\close.svg" />
```

Falsche Asset-Pfade fallen häufig erst im Build oder Hosting auf.

---

## Hosting-Checkliste

Nach dem Upload prüfen:

```text
Startseite lädt
Navigation funktioniert
Reload auf /board funktioniert
Reload auf /contacts funktioniert
Reload auf /add-task funktioniert
Assets laden ohne 404
Supabase-Verbindung funktioniert
Kontakte laden
Tasks laden
Task erstellen funktioniert
Kontakt erstellen funktioniert
Browser-Konsole ohne kritische Fehler
mobile Ansicht funktioniert
```

---

## Browser-Konsole prüfen

Nach Deployment im Browser öffnen:

```text
DevTools
→ Console
→ Network
```

Prüfen:

```text
keine 404 bei Assets
keine 404 bei Routen
keine Supabase-Fehler
keine CORS-Fehler
keine JavaScript-Runtime-Fehler
keine fehlenden Environment-Werte
```

---

## Cache beachten

Browser und Hosting können alte Dateien cachen.

Wenn nach einem Upload noch alte Dateien erscheinen:

```text
Hard Reload durchführen
Cache leeren
Inkognito-Fenster testen
Hosting-Cache prüfen
```

Angular erzeugt für JS- und CSS-Dateien Hashes im Dateinamen. Dadurch werden neue Builds meistens korrekt geladen.

---

## Finale User-Flows

Vor Abgabe mindestens diese Flows prüfen:

```text
App öffnet sich
Navigation zu Summary
Navigation zu Contacts
Kontakt auswählen
Kontakt erstellen
Kontakt bearbeiten
Kontakt löschen
Navigation zu Board
Board lädt Tasks
Task-Detail öffnen
Task erstellen
Task mit Subtasks erstellen
Task mit Kontaktzuweisungen erstellen
Task verschieben
Reload erhält Daten
mobile Navigation funktioniert
Dialoge sind mobil bedienbar
```

---

## Responsive Prüfung

Mindestens prüfen:

```text
320px
360px
375px
428px
768px
799px
800px
1024px
1280px
1440px
1920px
```

Zusätzlich:

```text
Mobile Landscape
Tablet Landscape
```

Wichtig:

```text
kein horizontaler Scroll
Navigation erreichbar
Header sichtbar
Dialoge bedienbar
Buttons nicht verdeckt
Task Cards lesbar
Kontaktliste bedienbar
```

---

## Finaler Git-Check

Vor finalem Push:

```bash
git status --short
git diff --check
git grep -n "<<<<<<<\|=======\|>>>>>>>"
npm run build
```

Erwartung:

```text
nur gewünschte Dateien geändert
keine Whitespace-Fehler
keine Konfliktmarker
Build erfolgreich
```

---

## Finaler Doku-Check

Prüfen:

```text
README.md aktuell
docs/allgemein.md aktuell
neue Doku-Dateien verlinkt
Dateinamen stimmen
keine veralteten Links
keine leeren Doku-Dateien
keine widersprüchlichen Aussagen
```

Neue Doku-Dateien müssen in README und `docs/allgemein.md` aufgenommen werden.

---

## Pull Request für finale Änderungen

Der finale Pull Request sollte enthalten:

```text
kurze Zusammenfassung
betroffene Bereiche
Build-Ergebnis
manuelle Tests
offene bekannte Punkte
```

Beispiel:

```md
## Änderungen
- Dokumentation finalisiert
- Deployment- und Build-Hinweise ergänzt
- Doku-Navigation aktualisiert

## Tests
- [ ] npm run build
- [ ] git diff --check
- [ ] relevante User-Flows geprüft

## Hinweise
- RLS ist für Demo offen und nicht produktionssicher.
```

---

## Abgabe-Checkliste

Vor Abgabe prüfen:

```text
[ ] main enthält den abgestimmten finalen Stand
[ ] alle Teammitglieder haben aktuellen Stand
[ ] npm run build erfolgreich
[ ] keine Konfliktmarker
[ ] keine echten Environment-Keys
[ ] Supabase erreichbar
[ ] Seed- oder Demo-Daten vorhanden
[ ] Contacts funktionieren
[ ] Board funktioniert
[ ] Add Task funktioniert
[ ] Task-Relations funktionieren
[ ] Routing funktioniert
[ ] mobile Ansicht funktioniert
[ ] README aktuell
[ ] docs aktuell
[ ] bekannte offene Punkte notiert
```

---

## Häufige Fehler vermeiden

### Falschen Ordner hochladen

Falsch:

```text
gesamtes Projekt hochladen
```

Richtig:

```text
nur den Inhalt des Browser-Build-Ordners hochladen
```

---

### Environment-Dateien committen

Falsch:

```text
environment.ts mit echtem Supabase Key im Repository
```

Richtig:

```text
environment.example.ts mit Platzhaltern
```

---

### SPA-Fallback vergessen

Problem:

```text
Startseite funktioniert
Reload auf /board führt zu 404
```

Lösung:

```text
SPA-Fallback auf index.html einrichten
```

---

### Base-Href falsch

Problem:

```text
App liegt in /join/
Assets oder Routen laden falsch
```

Lösung:

```bash
ng build --configuration production --base-href /join/
```

---

### Supabase Demo nicht testen

Problem:

```text
App lädt
aber Daten werden nicht angezeigt
```

Prüfen:

```text
URL
anon key
RLS
Tabellen
Browser-Konsole
Network-Tab
```

---

## Zusammenfassung

Für Deployment und Abgabe zählt nicht nur, dass der Code lokal läuft.

Der Build muss erfolgreich sein.  
Environment-Dateien müssen sicher behandelt werden.  
Supabase muss erreichbar sein.  
Routing muss nach Reload funktionieren.  
Assets müssen korrekt laden.  
Die wichtigsten User-Flows müssen nach Deployment geprüft werden.

Erst dann ist der Stand abgabefähig.