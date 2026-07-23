# SupabaseService

Dieses Dokument beschreibt den `SupabaseService` im Join-Projekt. Der Service stellt den zentralen Supabase Client für die Anwendung bereit.

Er ist die technische Verbindung zwischen Angular und Supabase.

---

## Aufgabe

Der `SupabaseService` erstellt und kapselt den Supabase Client.

Er ist zuständig für:

```text
Supabase Client erzeugen
Supabase URL verwenden
Supabase anon public key verwenden
Client zentral bereitstellen
direkte Client-Erzeugung im Projekt vermeiden
```

Der Service enthält keine Feature-Logik.

Nicht seine Aufgabe:

```text
Kontakte laden
Tasks speichern
Subtasks synchronisieren
Kontaktzuweisungen verwalten
UI-State halten
Formulare validieren
```

Diese Aufgaben liegen in Feature-Services, Repositorys oder Components.

---

## Grundidee

Supabase wird zentral initialisiert.

```text
environment
  ↓
SupabaseService
  ↓
Supabase Client
  ↓
Repository / Service
```

Dadurch gibt es nur eine Stelle, an der der Client erstellt wird.

---

## Typischer Aufbau

Der Service verwendet die Supabase-Konfiguration aus den Environment-Dateien.

```typescript
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );
}
```

Der genaue Dateiaufbau kann je nach Projektstand leicht abweichen. Wichtig ist, dass die Client-Erzeugung zentral bleibt.

---

## Environment-Dateien

Die echten Supabase-Werte liegen lokal in:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

Diese Dateien werden nicht committed.

Beispiel:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

---

## Environment-Beispieldatei

Für das Team kann eine Beispiel-Datei committed werden:

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

So weiß jedes Teammitglied, welche Werte lokal benötigt werden, ohne echte Keys ins Repository zu schreiben.

---

## Sicherheitsregel

Im Frontend wird ausschließlich der Supabase `anon public key` verwendet.

Nicht erlaubt:

```text
service_role key
```

Der `service_role` Key hat zu viele Rechte und darf niemals in Angular, GitHub oder Browser-Code landen.

Wichtig:

```text
anon public key
→ für Frontend erlaubt

service_role key
→ niemals im Frontend
```

---

## Verwendung im Repository

Datenbanknahe Klassen verwenden den Client über den `SupabaseService`.

Beispiel:

```typescript
@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  private readonly supabase = inject(SupabaseService).client;
}
```

Das Repository führt dann konkrete Abfragen aus:

```typescript
this.supabase
  .from('tasks')
  .select('*');
```

Diese Abfragen bleiben im Repository oder datenbanknahen Service.

---

## Nicht in Components verwenden

Components sollen den Supabase Client nicht direkt verwenden.

Falsch:

```typescript
private readonly supabase = inject(SupabaseService).client;

async loadTasks(): Promise<void> {
  const { data } = await this.supabase
    .from('tasks')
    .select('*');
}
```

Richtig:

```typescript
private readonly taskService = inject(TaskService);

async loadTasks(): Promise<void> {
  await this.taskService.getTasks();
}
```

Components sollen nicht wissen, welche Tabelle abgefragt wird oder wie Supabase-Payloads aufgebaut sind.

---

## Warum Components nicht direkt Supabase nutzen

Direkter Supabase-Zugriff in Components führt schnell zu Problemen:

```text
Datenbanklogik verteilt sich im UI.
Mapping wird mehrfach geschrieben.
Fehlerbehandlung wird uneinheitlich.
State wird schwer synchron zu halten.
Tests und Reviews werden schwieriger.
Änderungen an Tabellen betreffen zu viele Dateien.
```

Deshalb läuft der Zugriff über:

```text
Component
  ↓
Service
  ↓
Repository
  ↓
SupabaseService
  ↓
Supabase
```

---

## Fehlerbehandlung

Der `SupabaseService` selbst behandelt normalerweise keine fachlichen Fehler.

Supabase-Fehler entstehen bei konkreten Abfragen.

Diese werden behandelt in:

```text
Repository
Service
Component
```

Typischer Ablauf:

```text
Supabase Query schlägt fehl
  ↓
Repository wirft Fehler
  ↓
Service setzt Fehlermeldung und wirft weiter
  ↓
Component entscheidet über UI-Reaktion
```

---

## RLS und Policies

Der `SupabaseService` ändert keine RLS-Policies.

RLS wird direkt in Supabase konfiguriert.

Für die Entwicklungs- und Demo-Phase können Policies offen sein.  
Das ist nicht produktionssicher.

Für eine produktive Anwendung wären nötig:

```text
Supabase Auth
benutzerbezogene Policies
eingeschränkte Rechte
keine offenen Schreibrechte für anon
```

---

## Typische Fehler vermeiden

### Service Role Key im Frontend

Falsch:

```typescript
supabaseAnonKey: 'SERVICE_ROLE_KEY'
```

Richtig:

```typescript
supabaseAnonKey: 'ANON_PUBLIC_KEY'
```

---

### Environment-Dateien committen

Falsch:

```text
src/environments/environment.ts
```

mit echten Supabase-Werten committen.

Richtig:

```text
src/environments/environment.example.ts
```

mit Platzhaltern committen.

---

### Mehrere Supabase Clients erzeugen

Falsch:

```typescript
const client = createClient(url, key);
```

in mehreren Dateien.

Richtig:

```typescript
inject(SupabaseService).client
```

zentral verwenden.

---

### Supabase-Queries in Templates oder Components

Falsch:

```text
Component fragt Tabelle direkt ab.
```

Richtig:

```text
Component ruft Service auf.
Service nutzt Repository.
Repository nutzt SupabaseService.
```

---

## Prüfpunkte

Nach Änderungen am Supabase-Zugriff prüfen:

```text
Build läuft.
Environment-Dateien sind nicht im Commit.
Supabase Client wird zentral erzeugt.
Components greifen nicht direkt auf Supabase zu.
Repositorys verwenden den SupabaseService.
anon public key wird verwendet.
service_role key ist nirgends im Frontend.
```

Befehle:

```bash
npm run build
git status --short
git diff --check
```

Optional prüfen:

```bash
git grep -n "service_role"
git grep -n "createClient"
```

`createClient` sollte nur an der zentral vorgesehenen Stelle auftauchen.

---

## Abgrenzung zu anderen Dokumenten

Für Tabellen, Relationen und SQL:

```text
docs/supabase-database.md
```

Für Datenbankarchitektur:

```text
docs/database-architecture.md
```

Für Repository, Mapper und Payload-Mapper:

```text
docs/task-data-layer.md
```

Für Environment- und Workflow-Regeln:

```text
docs/development-workflow.md
```

---

## Zusammenfassung

Der `SupabaseService` stellt den Supabase Client zentral bereit.

Er enthält keine Feature-Logik und keine UI-Logik.  
Repositorys und datenbanknahe Services verwenden ihn für konkrete Abfragen.  
Components greifen nicht direkt auf Supabase zu.

Dadurch bleibt die Datenbankanbindung zentral, sicherer und leichter wartbar.