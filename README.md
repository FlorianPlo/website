# Glücksrad – Mehrdateien-Version (HTML/CSS/JS)

Dieses Projekt ist **komplett offline** nutzbar und in mehrere Dateien aufgeteilt:

```
gluecksrad/
├─ index.html
├─ styles.css
├─ wheel.js
└─ assets/
   ├─ hearts.svg
   ├─ cookie.svg
   └─ README_assets.txt
```

## Starten

1. Lade den Ordner herunter (oder entpacke die ZIP).
2. Öffne **index.html** doppelt via Browser (Chrome/Firefox/Safari).
3. Tippe auf **„Drehen“** – das Rad stoppt zufällig auf einem Segment, und der zugehörige Text wird **korrekt** unter dem Rad angezeigt.

## Inhalte anpassen (Segmente)

In `wheel.js` findest du das Array `segments`. Beispiel:
```js
{ text: "Kusspause! 😘", emoji: "😘", type: "overlay", overlay: { emoji: "😘", title: "Kusspause! 😘" } }
```
- `text`: Wird groß unter dem Rad angezeigt.
- `emoji`: Kleines Symbol im Segment.
- `type`: `"overlay" | "hearts" | "message"`
  - `overlay`: Öffnet ein Overlay. Optional mit `imageSrc` oder `videoSrc` (lokale Dateien aus `/assets`).
  - `hearts`: Herz-Konfetti.
  - `message`: Nur Text + dezentes Konfetti.
- `overlay`: `{ emoji, title, imageSrc, videoSrc, poster }`

### Eigenes Bild/Video

Lege Dateien in `/assets` ab und verlinke sie, z. B.:
```js
{ text: "Lustiges Video", emoji: "🎬", type: "overlay",
  overlay: { title: "Lustiges Video", videoSrc: "assets/cute.mp4", poster: "assets/preview.jpg" } }
```

## Warum „korrektes“ Ergebnis?

Die Drehlogik setzt die Zielrotation **exakt** so, dass die (leicht zufällig versetzte) Mitte des gewählten Segments am oberen **Zeiger** landet. Das Ergebnis wird **genau für dieses Segment** angezeigt – kein Versatz, keine Randtreffer.

Formel (vereinfachte Idee):
- Wir wählen `chosenIndex` zufällig.
- Segmentwinkel `seg = 360/N`, Segmentmitte `mid = chosenIndex*seg + seg/2`.
- Der Zielwinkel ist kongruent zu `-(mid + offset)` modulo 360.
- Die Animation fügt mehrere Umdrehungen hinzu (4–6), bleibt aber bei exakt dieser Kongruenz.
- Nach `transitionend` zeigen wir den gewählten Eintrag über `chosenIndex` an.

## Barrierefreiheit & Mobil

- Bedienelemente sind per **Enter/Leertaste** auslösbar.
- Hintergrundanimationen respektieren `prefers-reduced-motion`.
- Voll responsive (Smartphone/Tablet/Desktop).

Viel Spaß! 💖
