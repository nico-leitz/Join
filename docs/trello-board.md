# Trello-Board

Dieses Dokument beschreibt, wie das Trello-Board im Join-Projekt genutzt wird. Ziel ist, dass Aufgaben transparent bleiben, niemand doppelt arbeitet und der Sprintfortschritt für das Team nachvollziehbar ist.

Das Trello-Board ist die zentrale Übersicht für Planung, Aufgabenstatus und offene Punkte.

---

## Grundregel

Das Trello-Board wird täglich aktuell gehalten.

Wichtig:

```text
Aufgaben nicht ohne Absprache verschieben.
Aufgaben nicht ohne Absprache übernehmen.
Nicht mehr als zwei Aufgaben gleichzeitig bearbeiten.
Statusänderungen im Daily oder Gruppencall abstimmen.
```

Das Board ersetzt nicht die Kommunikation im Team. Es unterstützt sie.

---

## Zweck des Trello-Boards

Das Trello-Board zeigt:

```text
welche Aufgaben geplant sind
wer an welcher Aufgabe arbeitet
welche Aufgaben blockiert sind
welche Aufgaben reviewed werden müssen
welche Aufgaben fertig sind
welche Punkte später umgesetzt werden
```

Dadurch kann jedes Teammitglied schnell erkennen, woran gearbeitet wird und wo Unterstützung nötig ist.

---

## Empfohlene Spalten

Das Board sollte mindestens diese Spalten enthalten:

```text
Backlog
Sprint To Do
In Progress
Review
Done
Blocked
Later
```

Je nach Teamabsprache können Namen leicht abweichen. Wichtig ist, dass jede Spalte eine klare Bedeutung hat.

---

## `Backlog`

Im Backlog liegen Aufgaben, die grundsätzlich relevant sind, aber noch nicht für den aktuellen Sprint eingeplant wurden.

Beispiele:

```text
Login
Summary
optionale Animationen
spätere Refactorings
nice-to-have Features
```

Aufgaben aus dem Backlog werden nur nach Absprache in einen Sprint übernommen.

---

## `Sprint To Do`

Diese Spalte enthält Aufgaben, die im aktuellen Sprint umgesetzt werden sollen.

Eine Aufgabe in `Sprint To Do` sollte klar genug sein, damit ein Teammitglied sie starten kann.

Eine gute Aufgabe enthält:

```text
kurzen Titel
kurze Beschreibung
betroffenen Bereich
Akzeptanzkriterien
zuständige Person
ggf. technische Hinweise
```

---

## `In Progress`

In `In Progress` liegen Aufgaben, an denen aktiv gearbeitet wird.

Regeln:

```text
maximal zwei aktive Aufgaben pro Person
keine fremden Aufgaben ohne Absprache übernehmen
bei Blockern früh melden
regelmäßig Zwischenstand im Daily nennen
```

Wenn eine Aufgabe größer wird als erwartet, sollte sie aufgeteilt werden.

---

## `Review`

In `Review` liegen Aufgaben, die umgesetzt sind, aber noch geprüft werden müssen.

Eine Aufgabe darf erst in `Review`, wenn:

```text
Code umgesetzt ist
Build lokal geprüft wurde
keine offensichtlichen Konsolenfehler vorhanden sind
relevante User-Flows getestet wurden
Commit oder Pull Request vorhanden ist
```

---

## `Done`

In `Done` liegen Aufgaben, die abgeschlossen und reviewed sind.

Eine Aufgabe gilt erst als erledigt, wenn:

```text
MVP-Anforderung erfüllt ist
Review abgeschlossen ist
keine kritischen Fehler offen sind
Doku angepasst wurde, falls nötig
Team über relevante Änderungen informiert ist
```

---

## `Blocked`

In `Blocked` liegen Aufgaben, die aktuell nicht weiterbearbeitet werden können.

Mögliche Gründe:

```text
fehlende Datenbankstruktur
offene Designentscheidung
ungeklärte Zuständigkeit
Merge-Konflikt
abhängige Aufgabe ist noch nicht fertig
technischer Fehler
```

Blocker müssen im Daily genannt werden.

Eine blockierte Aufgabe sollte eine kurze Notiz enthalten:

```text
Warum ist sie blockiert?
Wer kann helfen?
Was ist der nächste Schritt?
```

---

## `Later`

In `Later` liegen Aufgaben, die bewusst verschoben wurden.

Beispiele:

```text
Nice-to-have Features
größere SCSS-Refactorings
Optimierungen nach MVP
optionale Tests
Verbesserungen nach Dozentenreview
```

Wichtig:  
`Later` bedeutet nicht vergessen. Es bedeutet nur, dass die Aufgabe nicht zum aktuellen Sprint-MVP gehört.

---

## Kartenaufbau

Eine Trello-Karte sollte möglichst klar und knapp sein.

Empfohlener Aufbau:

```md
## Ziel
Was soll umgesetzt werden?

## Akzeptanzkriterien
- ...

## Betroffene Dateien / Bereiche
- ...

## Hinweise
- ...

## Tests
- [ ] npm run build
- [ ] manueller Flow geprüft
```

Nicht jede kleine Aufgabe braucht alle Abschnitte. Bei größeren Tasks helfen sie aber sehr.

---

## Gute Kartentitel

Gute Titel sind konkret:

```text
TaskService: createTaskWithRelations umsetzen
Board: Tasks nach Status gruppieren
Contacts: mobile Dialog-Animation anpassen
Docs: TaskService-Datenfluss dokumentieren
```

Ungünstige Titel:

```text
Fix
Update
Zeug
Board machen
Doku
```

Der Titel soll direkt erkennen lassen, worum es geht.

---

## Labels

Labels helfen, Aufgaben schneller einzuordnen.

Empfohlene Labels:

```text
contacts
tasks
board
layout
database
docs
bug
review
blocked
responsive
```

Labels ersetzen keine Beschreibung. Sie dienen nur zur schnellen Orientierung.

---

## Zuständigkeit

Jede aktive Aufgabe sollte genau eine verantwortliche Person haben.

Weitere Personen können unterstützen oder reviewen, aber es sollte klar sein, wer den aktuellen Stand verantwortet.

Regel:

```text
Eine Aufgabe wird nicht ohne Absprache einer anderen Person weggenommen.
```

Wenn jemand Hilfe braucht, wird das im Daily oder Call angesprochen.

---

## Aufgaben aufteilen

Große Aufgaben sollen in kleinere Karten aufgeteilt werden.

Schlecht:

```text
Board fertig machen
```

Besser:

```text
Board: Spaltenstruktur erstellen
Board: Task Cards anzeigen
Board: Subtasks zuordnen
Board: Kontaktbadges anzeigen
Board: Drag-and-drop Status speichern
Board: mobile Move-Alternative
```

Kleinere Karten sind leichter zu planen, zu reviewen und abzuschließen.

---

## Akzeptanzkriterien

Akzeptanzkriterien beschreiben, wann eine Aufgabe fertig ist.

Beispiel:

```text
Task wird in Supabase gespeichert.
Subtasks werden mit task_id gespeichert.
Kontaktzuweisungen werden in task_assignments gespeichert.
Nach Reload sind alle Daten vorhanden.
Build läuft erfolgreich.
```

Ohne Akzeptanzkriterien ist oft unklar, wann eine Aufgabe wirklich abgeschlossen ist.

---

## Daily-Nutzung

Im Daily wird das Trello-Board gemeinsam geprüft.

Jede Person nennt kurz:

```text
Was wurde fertig?
Woran arbeite ich gerade?
Was ist blockiert?
Was brauche ich vom Team?
Welche Aufgabe kommt als nächstes?
```

Danach werden Karten bei Bedarf verschoben.

---

## Gruppencall-Nutzung

Im Gruppencall können größere technische Entscheidungen besprochen werden.

Beispiele:

```text
Datenbankstruktur
Service-Aufteilung
Component-Verantwortung
Merge-Reihenfolge
Review-Ergebnisse
Sprintprioritäten
```

Nach einer Entscheidung wird die betroffene Trello-Karte aktualisiert.

---

## Reviews im Trello-Board

Wenn eine Aufgabe fertig umgesetzt ist, wird sie nach `Review` verschoben.

Reviewer prüfen:

```text
Funktion
Codequalität
Build
Konsole
Responsive Verhalten, falls UI betroffen ist
Doku, falls Architektur oder Nutzung betroffen ist
```

Nach erfolgreichem Review kann die Aufgabe nach `Done`.

---

## Blocker dokumentieren

Wenn eine Aufgabe blockiert ist, reicht es nicht, sie nur nach `Blocked` zu verschieben.

Die Karte sollte ergänzt werden um:

```text
Blocker:
- ...

Nächster Schritt:
- ...

Benötigt von:
- ...
```

So kann das Team schneller helfen.

---

## Dokumentationsaufgaben

Doku-Aufgaben gehören ebenfalls ins Trello-Board.

Beispiele:

```text
docs: TaskService dokumentieren
docs: Datenbankstruktur beschreiben
docs: Component-Verantwortung festhalten
docs: Testing-Guide aktualisieren
```

Doku ist Teil der Definition of Done, wenn eine Aufgabe Architektur, Service-Nutzung oder Datenbankstruktur verändert.

---

## Datenbankänderungen im Trello

Datenbankänderungen müssen sichtbar geplant werden.

Eine Datenbankkarte sollte enthalten:

```text
betroffene Tabellen
neue Spalten
Constraints
RLS-Änderungen
Seed-Daten
betroffene Services
betroffene Models
Prüfqueries
```

Datenbankänderungen werden nicht nebenbei umgesetzt.

---

## Config-Änderungen im Trello

Änderungen an Config-Dateien müssen abgesprochen werden.

Dazu zählen:

```text
angular.json
package.json
package-lock.json
tsconfig.json
.gitignore
```

Solche Änderungen sollten im Trello sichtbar sein oder im Daily klar angekündigt werden.

---

## Prioritäten

Die höchste Priorität hat immer das MVP.

Reihenfolge:

```text
1. Muss für Sprintziel funktionieren
2. Muss für Review stabil sein
3. Sollte für UX verbessert werden
4. Nice-to-have
5. Späterer Refactor
```

Nice-to-have darf das MVP nicht gefährden.

---

## Umgang mit Review-Feedback

Review-Feedback wird als eigene Karte oder Checkliste aufgenommen.

Beispiele:

```text
Review: Contact-Dialog auf 320px prüfen
Review: TaskService-Doku präzisieren
Review: Board-Card Hover anpassen
Review: mobile Navigation prüfen
```

So bleibt nachvollziehbar, was aus dem Feedback entstanden ist.

---

## Definition of Done im Trello

Eine Karte darf nach `Done`, wenn:

```text
Aufgabe umgesetzt ist
Akzeptanzkriterien erfüllt sind
Build erfolgreich ist
relevante Tests durchgeführt wurden
Review erfolgt ist
keine offenen Blocker bestehen
Doku angepasst wurde, falls nötig
```

---

## Häufige Fehler vermeiden

### Aufgaben nicht ohne Absprache verschieben

Falsch:

```text
fremde Aufgabe von In Progress nach Done schieben
```

Richtig:

```text
erst im Daily oder direkt mit der Person klären
```

---

### Nicht zu viele Aufgaben gleichzeitig starten

Falsch:

```text
eine Person hat fünf Karten in In Progress
```

Richtig:

```text
maximal zwei aktive Aufgaben
```

---

### Keine unklaren Karten erstellen

Falsch:

```text
Task bearbeiten
```

Richtig:

```text
TaskService: updateTaskWithRelations für Subtasks und Kontakte anbinden
```

---

### Blocker nicht verstecken

Falsch:

```text
Aufgabe bleibt in In Progress, obwohl nichts weitergeht
```

Richtig:

```text
nach Blocked verschieben und Grund notieren
```

---

## Trello und Git verbinden

Trello-Karten und Commits sollten fachlich zusammenpassen.

Beispiel Karte:

```text
TaskService dokumentieren
```

Passender Commit:

```text
docs(tasks): document task service data flow
```

Beispiel Karte:

```text
Board: Task Cards anzeigen
```

Passender Commit:

```text
feat(board): add task card rendering
```

Dadurch bleibt später nachvollziehbar, welche Änderung zu welcher Aufgabe gehört.

---

## Zusammenfassung

Das Trello-Board ist die gemeinsame Planungs- und Statusübersicht.

Es zeigt, was geplant ist, wer woran arbeitet, was blockiert ist und was reviewed werden muss. Aufgaben werden klein gehalten, täglich aktualisiert und nicht ohne Absprache verschoben.

So bleibt der Sprintstand für alle Teammitglieder transparent.