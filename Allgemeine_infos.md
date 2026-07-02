# Befehle zum erstellen der Dateien

## Vorbereitung: Tests global deaktivieren

ng config schematics.@schematics/angular:component.skipTests true
ng config schematics.@schematics/angular:service.skipTests true
ng config schematics.@schematics/angular:guard.skipTests true
ng config schematics.@schematics/angular:interceptor.skipTests true
ng config schematics.@schematics/angular:pipe.skipTests true
ng config schematics.@schematics/angular:directive.skipTests true

## Angular Components

ng generate component layout/header --style=scss --skip-tests
ng generate component layout/sidebar --style=scss --skip-tests
ng generate component layout/mobile-nav --style=scss --skip-tests
ng generate component layout/page-shell --style=scss --skip-tests

ng generate component shared/components/button --style=scss --skip-tests
ng generate component shared/components/dialog --style=scss --skip-tests
ng generate component shared/components/input-field --style=scss --skip-tests
ng generate component shared/components/user-avatar --style=scss --skip-tests

ng generate component features/auth/pages/login --style=scss --skip-tests
ng generate component features/auth/pages/signup --style=scss --skip-tests
ng generate component features/summary/pages/summary --style=scss --skip-tests
ng generate component features/board/pages/board --style=scss --skip-tests
ng generate component features/tasks/pages/add-task --style=scss --skip-tests
ng generate component features/contacts/pages/contacts --style=scss --skip-tests

ng generate component features/board/components/board-column --style=scss --skip-tests
ng generate component features/board/components/task-card --style=scss --skip-tests
ng generate component features/board/components/task-detail-dialog --style=scss --skip-tests

ng generate component features/contacts/components/contact-list --style=scss --skip-tests
ng generate component features/contacts/components/contact-detail --style=scss --skip-tests
ng generate component features/contacts/components/contact-form --style=scss --skip-tests

ng generate component features/legal/legal-notice --style=scss --skip-tests
ng generate component features/legal/privacy-policy --style=scss --skip-tests

## Services / Guard / Interceptor

ng generate service core/services/supabase --skip-tests
ng generate service core/services/auth --skip-tests
ng generate service core/services/profile --skip-tests
ng generate service core/services/workspace --skip-tests

ng generate service features/board/services/board --skip-tests
ng generate service features/tasks/services/task --skip-tests
ng generate service features/contacts/services/contact --skip-tests

ng generate guard core/guards/auth --skip-tests
ng generate interceptor core/interceptors/auth --skip-tests

## Interfaces / Models

ng generate interface shared/models/profile
ng generate interface shared/models/workspace
ng generate interface shared/models/contact
ng generate interface shared/models/task
ng generate interface shared/models/subtask
ng generate interface shared/models/category

## Zusätzliche Ordner

mkdir public\icons
mkdir public\images
mkdir public\data

mkdir src\app\core\config
mkdir src\app\shared\directives
mkdir src\app\shared\pipes
mkdir src\app\shared\utils

mkdir src\styles\abstracts
mkdir src\styles\base
mkdir src\styles\components
mkdir src\styles\layout
mkdir src\styles\pages
mkdir src\styles\themes
mkdir src\styles\vendors
mkdir src\styles\utilities

mkdir docs

## Zusätzliche Dateien

type nul > src\app\core\config\supabase.config.ts

type nul > src\styles\abstracts\_variables.scss
type nul > src\styles\abstracts\_breakpoints.scss
type nul > src\styles\abstracts\_mixins.scss
type nul > src\styles\abstracts\_functions.scss

type nul > src\styles\base\_reset.scss
type nul > src\styles\base\_base.scss
type nul > src\styles\base\_typography.scss

type nul > src\styles\components\_buttons.scss
type nul > src\styles\components\_forms.scss
type nul > src\styles\components\_dialogs.scss
type nul > src\styles\components\_cards.scss
type nul > src\styles\components\_badges.scss

type nul > src\styles\layout\_container.scss
type nul > src\styles\layout\_header.scss
type nul > src\styles\layout\_sidebar.scss
type nul > src\styles\layout\_navigation.scss
type nul > src\styles\layout\_page.scss

type nul > src\styles\pages\_auth.scss
type nul > src\styles\pages\_summary.scss
type nul > src\styles\pages\_board.scss
type nul > src\styles\pages\_tasks.scss
type nul > src\styles\pages\_contacts.scss

type nul > src\styles\themes\_default.scss
type nul > src\styles\vendors\_angular-material-overrides.scss

type nul > src\styles\utilities\_spacing.scss
type nul > src\styles\utilities\_helpers.scss

type nul > src\styles\main.scss

type nul > docs\architecture.md
type nul > docs\conventions.md
type nul > docs\sprint-plan.md
type nul > docs\trello-board.md
type nul > docs\database-architecture.md



# Skills
- Basti: Struktur, Logik und Datenbanken, API's
- Kevin: Design, Logik
- Oliver:
- Nico: Struktur, Logik, Datenbanken, API's, SCSS

# GitHub Manifest
- repo clonen
- Main Branch - (Produktiv)
- Jede Person bekommt einen eigenen Branch (Entwicklung)
- ! Wichtig: Vor Arbeitsantritt immer Pullen (Pflicht Pull nach den Dailies/Merging)
- ! Sicherstellen das nach dem Daily wirklich jeder auf dem gleichen Stand ist !
- ! Config-Dateien nur nach Absprache anfassen

## Wie werden Reviews gehandhabt
- Sind Pflicht!
- Jeder sollte sich für die Reviews 30min (pro Tag) Zeit nehmen
- Merging wird im Daily besprochen (Gerne vorab Notizen machen)
- 6 Augen Prinzip (First Check + Second Check)

## Nach welchen Regeln wird in die Main gepushed
- Beim Daily wird in die Main gepushed/gemerged (Nach Absprache)
- Änderungen müssen immer vorher abgesprochen werden

## Commitstruktur
- Commit struktur: Beispiel feat(layout): add basic layout
- Aufbau vor der klammer feat/fix/docs/refactor
- In der Klammer () steht der Bereich
- nach dem doppelpunkt klare Bennenung mit add/create/harden/correct/adapt etc.
- danach die Änderung angeben

# Projektplanung (Trello)
- Grundstruktur wird nicht verändert (ggf. nach Absprache)
- Auf keinen Fall unabgesprochen Task hin und her schieben (oder anderen wegnehmen)
- Nicht mehr als an 2 Tasks gleichzeitig arbeiten
- Täglich Updaten

## Wie werden Aufgaben verteilt
- Werden innerhalb der Gruppe abgesprochen (im Daily)
- Realistische Aufgaben Verteilung (Nach Skills und Zeit)
- Aufgaben sollen auf alle Entwickler gleichmäßig aufgeteilt werden

# Tests (Wenn noch Zeit ist oder jemand interesse daran hat)

# Allgemeines und Infos: 

## Zeiten für Dailies und Calls
- Montags, Mittwoch, Freitags -> 11:00 Uhr Daily
- Dienstags, Donnerstags -> 11:00 Uhr Gruppencall

## Sprintphasen

- Phase 1: Implementierung des Kontaktbereichs sowie der Datenbankanbindung inklusive responsiver Navigation (vorerst ohne funktionale Logik, Stichtag: Donnerstag, der 09.).

- Phase 2: Entwicklung der Funktion zum Anlegen von Tasks sowie die Implementierung der Drag-and-Drop-Funktionalität für das Board.

- Phase 3: Fertigstellung der Zusammenfassung (Summary) und des Login-Bereichs.

# Verpflichtend für alle:
- MVP ist immer die erste Priorität (Features Last)
- Angular Poster kaufen und 3 mal am Tag praisen
- Spaß haben!

