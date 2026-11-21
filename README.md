# Bierkollektion 🍺

Sammel-App für deutsche Biere: Alle Logos sind anfangs ausgegraut. Hast du ein Bier getrunken, tippst du auf das Logo, und es wird farbig. So entsteht nach und nach deine Kollektion.

- **Marken-Modus:** eine Kachel pro Marke. Ein Tipp markiert die Marke, das Badge „2/7“ öffnet die einzelnen Sorten.
- **Sorten-Modus:** alle Sorten nach Marke gruppiert, einzeln abhakbar.
- **Filter:** Suche, Bierstil, Bundesland, gesammelt/offen.
- **Fortschritt** für Marken und Sorten, Goldrand für komplett gesammelte Marken.

Katalog v0.1: 86 Marken, 191 Sorten. Die Logos sind Platzhalter.

## Wo die Daten liegen

Die App hat keinen Server. Jede Person sammelt **in ihrem eigenen Browser** (localStorage), und niemand sieht die Sammlung der anderen.

- Auf dem Handy über **„Zum Home-Bildschirm“** installieren (Android: Chrome-Menü oder Hinweis „App installieren“, iPhone: Safari → Teilen → „Zum Home-Bildschirm“). Dann läuft sie wie eine App, auch offline, und der Browser löscht die Daten nicht so leicht.
- **iPhone:** Die installierte App hat einen eigenen Speicher, getrennt von Safari. Also direkt installieren und nur über das App-Icon sammeln, oder eine Safari-Sammlung per Backup übertragen.
- **Backup sichern** (unten auf der Seite) öffnet auf dem Handy das Teilen-Menü: In Dateien sichern, AirDrop oder per Messenger an sich selbst schicken. Wo Teilen nicht geht, z. B. am Desktop, wird die `.json`-Datei heruntergeladen. **Backup laden** führt eine gesicherte Datei wieder zusammen, z. B. auf einem neuen Handy. Dabei geht nichts verloren.
- Wer den Browserverlauf samt Website-Daten löscht oder im privaten Modus surft, verliert die Sammlung, wenn kein Backup existiert.

## Auf GitHub Pages veröffentlichen

1. Auf github.com ein **neues öffentliches Repository** anlegen, z. B. `bierkollektion`. GitHub Pages ist für öffentliche Repos kostenlos.
2. Im leeren Repo auf **„uploading an existing file“** klicken und **den Inhalt dieses Ordners** hineinziehen: `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll` und die Ordner `css`, `js`, `icons`. Dann **Commit changes**.
3. **Settings → Pages**: unter „Build and deployment“ *Source: Deploy from a branch*, Branch **main**, Ordner **/ (root)**, dann **Save**.
4. Nach ein bis zwei Minuten läuft die App unter
   `https://<dein-github-name>.github.io/bierkollektion/`
   Diesen Link an die Freunde schicken.

## Lokal ausprobieren

Einfach `index.html` im Browser öffnen. Offline-Modus und Installation gibt es nur über https (also auf GitHub Pages).

## Katalog erweitern

Alle Biere stehen in `js/katalog.js`, eine Zeile pro Marke:

```js
["augustiner","Augustiner","AUG","#7a2a1e","BY","München",[["Lagerbier Hell","helles"],["Edelstoff","export"]]],
// id,        Name,        Kürzel, Farbe,   Land, Ort,     [[Sorte, Stil], …]
```

- Die Stil-Schlüssel (`pils`, `helles`, `weizen`, `koelsch`, `alt`, `bock` …) stehen oben in der Datei.
- **Bestehende `id`s und Sortennamen nicht umbenennen**, sonst verlieren alle die Häkchen dazu. Neue Einträge hinzufügen geht jederzeit.
- Nach jeder Änderung in `sw.js` die Zeile `const CACHE = "bierkollektion-v2"` hochzählen (`-v3`, `-v4` …), damit installierte Apps die neue Version laden.

## Dateien

```
index.html             Seite
css/style.css          Gestaltung
js/katalog.js          Bierliste
js/app.js              Logik, Speichern, Backup
manifest.webmanifest   App-Installation
sw.js                  Offline-Cache
icons/                 App-Icons
```
