# Routing und Navigation

Dieses Dokument beschreibt das Routing und die Navigation im Join-Projekt. Ziel ist, dass Seitenwechsel, aktive Navigationseinträge und responsive Navigation einheitlich umgesetzt werden.

---

## Überblick

Die Anwendung besteht aus mehreren Hauptseiten:

```text
Summary
Add Task
Board
Contacts
```

Diese Seiten werden über Angular Routing geöffnet.

Die Navigation besteht aus:

```text
Sidebar
Header
Mobile Navigation
```

Je nach Viewport wird entweder die Sidebar oder die mobile Navigation angezeigt.

---

## Grundregel

Routing gehört zur App-Struktur.

Feature-Components sollen nicht selbst entscheiden, wie die globale Navigation aufgebaut ist.

```text
Routing
→ app.routes.ts

Navigation
→ Layout-Components

Feature-Inhalt
→ Feature-Components
```

---

## Hauptbereiche

Typische Routen:

```text
/summary
/add-task
/board
/contacts
```

Die Namen können im finalen Stand leicht abweichen. Wichtig ist, dass Sidebar, mobile Navigation und Routing dieselben Pfade verwenden.

---

## App-Routing

Das zentrale Routing liegt in:

```text
src/app/app.routes.ts
```

Beispielstruktur:

```typescript
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'summary',
    pathMatch: 'full',
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./features/summary/pages/summary/summary')
        .then((m) => m.Summary),
  },
  {
    path: 'add-task',
    loadComponent: () =>
      import('./features/tasks/pages/add-task/add-task')
        .then((m) => m.AddTask),
  },
  {
    path: 'board',
    loadComponent: () =>
      import('./features/board/pages/board/board')
        .then((m) => m.Board),
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./features/contacts/pages/contacts/contacts')
        .then((m) => m.Contacts),
  },
];
```

Bei Standalone Components kann `loadComponent` genutzt werden.

---

## Redirect

Die leere Route soll auf eine sinnvolle Startseite weiterleiten.

Beispiel:

```typescript
{
  path: '',
  redirectTo: 'summary',
  pathMatch: 'full',
}
```

Dadurch landet der User beim Öffnen der Anwendung nicht auf einer leeren Seite.

---

## Wildcard Route

Optional kann eine Fallback-Route ergänzt werden.

```typescript
{
  path: '**',
  redirectTo: 'summary',
}
```

Damit führen unbekannte Pfade zurück in die Anwendung.

Eine eigene Not-Found-Seite ist möglich, aber für das MVP nicht zwingend nötig.

---

## Layout-Struktur

Die globale App-Struktur sollte ungefähr so aufgebaut sein:

```text
App Component
├── Sidebar
├── Header
├── Router Outlet
└── Mobile Navigation
```

Der `router-outlet` zeigt die jeweilige Feature-Seite an.

```html
<app-sidebar />
<app-header />

<main class="app-content">
  <router-outlet />
</main>

<app-mobile-navigation />
```

Die genaue HTML-Struktur kann je nach aktuellem Layout abweichen. Wichtig ist, dass Header, Sidebar und mobile Navigation nicht in jeder Feature-Page neu eingebaut werden müssen, wenn sie global gelten.

---

## Sidebar

Die Sidebar ist die Desktop- und Tablet-Navigation.

Sie enthält Links zu:

```text
Summary
Add Task
Board
Contacts
```

Die Sidebar wird ab dem Desktop-/Tablet-Bereich angezeigt.

```text
ab 800px
→ Sidebar sichtbar
```

---

## Mobile Navigation

Die mobile Navigation ersetzt die Sidebar auf kleinen Viewports.

```text
bis 799px
→ Mobile Navigation sichtbar
```

Sie enthält ebenfalls die wichtigsten Hauptbereiche:

```text
Summary
Board
Add Task
Contacts
```

Die Reihenfolge sollte zum Figma-Design passen.

---

## Breakpoint-Regel

Die wichtige Grenze ist:

```text
bis 799px
→ mobile Navigation

ab 800px
→ Sidebar
```

Diese Grenze sollte einheitlich in Sidebar, mobile Navigation und Layout verwendet werden.

---

## Aktive Navigation

Aktive Navigationseinträge zeigen, auf welcher Seite der User gerade ist.

Angular bietet dafür:

```html
routerLinkActive="active"
```

Beispiel:

```html
<a
  routerLink="/board"
  routerLinkActive="active"
>
  Board
</a>
```

Die aktive Klasse muss in Sidebar und mobile Navigation konsistent gestylt werden.

---

## Exakte Aktivierung

Bei Routen wie `/summary` sollte geprüft werden, ob exakte Aktivierung nötig ist.

```html
<a
  routerLink="/summary"
  routerLinkActive="active"
  [routerLinkActiveOptions]="{ exact: true }"
>
  Summary
</a>
```

Das verhindert falsche Aktivzustände bei verschachtelten Routen.

---

## Navigationseinträge

Ein Navigationseintrag besteht aus:

```text
Icon
Label
Route
Active State
Hover State
Focus State
```

Beispiel:

```typescript
interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  activeIcon?: string;
}
```

Eine zentrale Liste kann doppelte Navigationseinträge vermeiden.

---

## Gemeinsame Navigation Items

Sidebar und mobile Navigation können dieselbe Datenstruktur verwenden.

Beispiel:

```typescript
readonly navigationItems = [
  {
    label: 'Summary',
    route: '/summary',
    icon: 'assets/icons/summary.svg',
  },
  {
    label: 'Add Task',
    route: '/add-task',
    icon: 'assets/icons/add-task.svg',
  },
  {
    label: 'Board',
    route: '/board',
    icon: 'assets/icons/board.svg',
  },
  {
    label: 'Contacts',
    route: '/contacts',
    icon: 'assets/icons/contacts.svg',
  },
];
```

Wenn Sidebar und mobile Navigation dieselben Einträge brauchen, sollte diese Struktur nicht mehrfach unterschiedlich gepflegt werden.

---

## Asset-Pfade

Icons werden über den Angular-Asset-Pfad eingebunden.

Richtig:

```html
<img src="assets/icons/board.svg" alt="" />
```

Nicht verwenden:

```html
<img src="./assets/icons/board.svg" />
<img src="public/assets/icons/board.svg" />
<img src="assets\icons\board.svg" />
```

Dateien liegen im Projekt unter:

```text
public/assets/...
```

Im Template wird verwendet:

```text
assets/...
```

---

## Header

Der Header enthält globale Informationen der App.

Typische Inhalte:

```text
Seitentitel
Logo oder Claim
User-Initialen
Hilfe- oder Info-Icon
```

Der Header sollte nicht in jeder Feature-Component separat nachgebaut werden.

---

## Seitentitel

Der Header kann einen festen Titel zeigen oder den Titel abhängig von der Route setzen.

Für das MVP reicht ein statischer Titel, wenn das Figma es so vorsieht.

Wenn dynamische Titel genutzt werden, sollten sie zentral aus Route-Daten kommen.

Beispiel:

```typescript
{
  path: 'board',
  data: {
    title: 'Board',
  },
  loadComponent: () => ...
}
```

---

## Feature-Seiten

Feature-Seiten sollten nur ihren eigenen Inhalt rendern.

Beispiel Board:

```text
Board Page
→ Board Header
→ Suche
→ Spalten
→ Task Cards
```

Nicht Aufgabe der Board Page:

```text
globale Sidebar anzeigen
globale mobile Navigation anzeigen
globale App-Struktur neu erzeugen
```

---

## Navigation aus Components

Wenn eine Component aktiv navigieren muss, verwendet sie den Angular Router.

Beispiel:

```typescript
private readonly router = inject(Router);

navigateToBoard(): void {
  void this.router.navigate(['/board']);
}
```

Für normale Links im Template ist `routerLink` besser.

```html
<a routerLink="/contacts">
  Contacts
</a>
```

---

## Nach Create zu Board navigieren

Nach dem Erstellen eines Tasks kann die Add-Task-Seite zum Board navigieren.

Beispiel:

```typescript
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  await this.taskService.createTaskWithRelations(
    this.createTaskInput(),
  );

  await this.router.navigate(['/board']);
}
```

Ob nach dem Speichern navigiert wird oder das Formular zurückgesetzt wird, ist eine UX-Entscheidung.

---

## Dialoge und Routing

Dialoge ändern normalerweise nicht die Route.

Beispiele:

```text
Add Contact Dialog
Edit Contact Dialog
Task Detail Dialog
Add Task Dialog
```

Diese Zustände bleiben Component-State.

```text
isDialogOpen
selectedTaskId
selectedContactForEdit
```

Nur echte Seitenwechsel gehören ins Routing.

---

## Detailansichten

Es gibt zwei mögliche Varianten:

```text
Detail als Dialog
Detail als eigene Route
```

Für das aktuelle Projekt reicht häufig ein Dialog oder eine mobile Overlay-Ansicht.

Eine eigene Route wäre möglich:

```text
/board/:taskId
/contacts/:contactId
```

Das ist aber nur sinnvoll, wenn Deep Links oder Browsernavigation dafür gebraucht werden.

---

## Browser-Zurück-Verhalten

Wenn Dialoge keinen eigenen Route-State haben, schließt der Browser-Zurück-Button nicht automatisch den Dialog.

Das ist für das MVP akzeptabel.

Soll ein Dialog über Zurück geschlossen werden, müsste der Dialogzustand in die URL aufgenommen werden. Das ist zusätzlicher Aufwand und sollte nur geplant umgesetzt werden.

---

## Guards

Für Sprint 3 kann Auth relevant werden.

Dann können Guards sinnvoll sein:

```text
nicht eingeloggte User auf Login leiten
eingeloggte User von Login auf Summary leiten
geschützte Routen absichern
```

Für die Demo-Phase ohne echten Auth-Flow sind Guards nicht zwingend notwendig.

---

## Auth-Routen

Mögliche Auth-Routen:

```text
/login
/signup
/reset-password
```

Diese sollten nur ergänzt werden, wenn der Auth-Bereich tatsächlich umgesetzt wird.

RLS und echte Auth-Policies müssen dann mit Supabase abgestimmt werden.

---

## Mobile Navigation und Dialoge

Dialoge können auf mobilen Viewports bewusst über der mobilen Navigation liegen.

Wichtig:

```text
Dialog ist vollständig bedienbar.
Close-Button bleibt sichtbar.
Submit-Button bleibt sichtbar.
Hintergrund scrollt nicht.
Mobile Navigation blockiert keine Formularbuttons.
```

Wenn ein Dialog modal ist, darf die Navigation dahinter nicht bedient werden.

---

## Z-Index-Regel

Navigation, Header, Overlay und Dialoge brauchen eine klare Ebene.

Typische Reihenfolge:

```text
normaler Inhalt
Header / Sidebar
Mobile Navigation
Overlay
Dialog
Success Overlay
```

Z-Index-Werte sollen nicht zufällig erhöht werden.

Nicht gut:

```scss
z-index: 999999;
```

Besser:

```text
bestehende Layer prüfen und gezielt einordnen
```

---

## Accessibility

Navigationseinträge sollen echte Links oder Buttons sein.

Für Seitenwechsel:

```html
<a routerLink="/board">
  Board
</a>
```

Für Aktionen:

```html
<button type="button">
  Add Task
</button>
```

Icon-only Buttons brauchen ein `aria-label`.

```html
<button
  type="button"
  aria-label="Open menu"
>
  <img src="assets/icons/menu.svg" alt="" />
</button>
```

---

## Focus State

Navigation muss per Tastatur bedienbar sein.

Prüfen:

```text
Tab-Reihenfolge ist logisch.
aktive Links sind erkennbar.
Focus ist sichtbar.
Links sind mit Enter aktivierbar.
Buttons sind mit Enter oder Space aktivierbar.
```

---

## Testbare Routing-Flows

Diese Flows sollten geprüft werden:

```text
/ leitet auf Summary weiter
/summary zeigt Summary
/add-task zeigt Add Task
/board zeigt Board
/contacts zeigt Contacts
unbekannte Route leitet sinnvoll weiter
Sidebar-Link öffnet passende Route
mobile Navigation öffnet passende Route
aktiver Sidebar-Link ist markiert
aktiver Mobile-Link ist markiert
Browser Reload auf Route funktioniert
Asset-Icons laden ohne 404
```

---

## Testbare Responsive-Flows

Prüfen:

```text
799px zeigt mobile Navigation
800px zeigt Sidebar
kein gleichzeitiges Anzeigen von Sidebar und Mobile Navigation
Header bleibt sichtbar
Content wird nicht von Navigation verdeckt
mobile Navigation verdeckt keine wichtigen Buttons
Dialoge liegen korrekt über Navigation
kein horizontaler Scroll
```

---

## Häufige Fehler vermeiden

### Unterschiedliche Routen in Sidebar und Mobile Navigation

Falsch:

```text
Sidebar: /add-task
Mobile: /tasks/add
```

Richtig:

```text
beide verwenden dieselbe Route
```

---

### Feature-Page rendert globale Navigation erneut

Falsch:

```text
Contacts Page enthält eigene Sidebar
Board Page enthält eigene Sidebar
```

Richtig:

```text
globale Navigation liegt im App-Layout
```

---

### Falsche Asset-Pfade

Falsch:

```html
<img src="public/assets/icons/contacts.svg" />
```

Richtig:

```html
<img src="assets/icons/contacts.svg" />
```

---

### Kein aktiver Zustand

Navigation ohne aktiven Zustand ist schwer verständlich.

Richtig:

```text
aktive Route in Sidebar und Mobile Navigation sichtbar markieren
```

---

### Links als div bauen

Falsch:

```html
<div (click)="navigateToBoard()">Board</div>
```

Richtig:

```html
<a routerLink="/board">Board</a>
```

---

## Abgrenzung zu anderen Dokumenten

Für Component-Verantwortung:

```text
docs/architecture.md
docs/conventions.md
```

Für responsive Styling:

```text
docs/scss-responsive-guide.md
```

Für Auth und spätere Routen:

```text
docs/sprint-plan.md
```

Für Tests:

```text
docs/testing-guide.md
```

---

## Zusammenfassung

Routing und Navigation verbinden die Hauptbereiche der Anwendung.

Die Routen liegen zentral in `app.routes.ts`.  
Sidebar und mobile Navigation verwenden dieselben Ziele.  
Feature-Components zeigen Inhalte, aber bauen nicht die globale Navigation neu auf.  
Aktive Navigation, responsive Umschaltung und korrekte Asset-Pfade müssen einheitlich umgesetzt werden.

Dadurch bleibt die App-Struktur nachvollziehbar und stabil.