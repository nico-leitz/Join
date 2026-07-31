# Technische Dokumentation

Diese Dokumentation beschreibt den finalen technischen Stand von **Join**. Sie richtet sich an Entwickler, Reviewer und Projektbeteiligte, die Architektur, Datenfluss, Sicherheitskonzept und Entwicklungsabläufe nachvollziehen möchten.

Die öffentliche Projektvorstellung mit Funktionsübersicht, Tech-Stack, Installation und Team befindet sich in der zentralen [`README.md`](../README.md) des Repositorys.

## Dokumentationsübersicht

### Architektur

| Dokument | Inhalt |
| --- | --- |
| [Anwendungsarchitektur](architecture/application.md) | Projektstruktur, Verantwortlichkeiten der Anwendungsschichten und grundlegender Datenfluss |
| [Authentifizierung und Routing](architecture/authentication-routing.md) | Supabase Auth, Sitzungsverwaltung, Gastzugang, Route Guard sowie öffentliche und geschützte Routen |
| [Datenbank und Sicherheit](architecture/database-security.md) | Datenmodell, Relationen, Migrationen, Row Level Security und Tabellenrechte |

### Features

| Dokument | Inhalt |
| --- | --- |
| [Kontakte](features/contacts.md) | Kontaktverwaltung, Komponentenaufbau, Datenzugriff und CRUD-Abläufe |
| [Tasks und Board](features/tasks-board.md) | Task-Datenmodell, Services, Board-Komponenten, Suche und Drag-and-drop |
| [Formulare und Validierung](features/forms-validation.md) | Formularaufbau, Validierungsregeln, Fehlermeldungen und Absendeverhalten |

### Engineering

| Dokument | Inhalt |
| --- | --- |
| [Konventionen](engineering/conventions.md) | Benennung, Code-Struktur, Dokumentation und gemeinsame Entwicklungsstandards |
| [State- und Fehlerbehandlung](engineering/state-error-handling.md) | Zustandsverwaltung, Ladezustände, Fehlerfluss und lokale Aktualisierungen |
| [Styling und Barrierefreiheit](engineering/styling-accessibility.md) | SCSS-Architektur, Partials, Responsive Design, Interaktionen und Accessibility |
| [Tests](engineering/testing.md) | Testaufbau, Testarten, Abdeckung und Prüfkommandos |

### Betrieb

| Dokument | Inhalt |
| --- | --- |
| [Entwicklungsworkflow](operations/development-workflow.md) | Branches, Commits, Reviews, Pull Requests und Qualitätsprüfungen |
| [Build und Deployment](operations/deployment.md) | Umgebungsanforderungen, Produktions-Build, Konfiguration und Bereitstellung |

## Empfohlene Lesereihenfolge

Für einen vollständigen technischen Einstieg:

1. [Anwendungsarchitektur](architecture/application.md)
2. [Datenbank und Sicherheit](architecture/database-security.md)
3. [Authentifizierung und Routing](architecture/authentication-routing.md)
4. Feature-Dokumentation zu [Kontakten](features/contacts.md) und [Tasks und Board](features/tasks-board.md)
5. Engineering- und Betriebsdokumentation nach Bedarf

## Dokumentationsgrundsätze

- Die Dokumentation bildet den finalen Projektstand ab.
- Historische Sprint-Notizen und doppelte Umsetzungserklärungen sind nicht Bestandteil der Abschlussdokumentation.
- Technische Details werden im jeweils zuständigen Dokument gepflegt.
- Relative Links und Pfadangaben beziehen sich auf das Repository.
- Änderungen an Architektur, Datenmodell oder Entwicklungsworkflow werden zusammen mit dem betroffenen Code dokumentiert.