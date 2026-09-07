# Meret & Beshoy — Wedding Invitation

A single-page, animated wedding invitation. Pure front-end: HTML, CSS and one
JavaScript file. No build step, no framework, no server, no database — so it
runs on any free static host forever.

## What's inside

```
index.html            all the wording, section by section
css/styles.css        the "Radiant" theme — burgundy cover, blush interior
js/main.js            CONFIG block + all behaviour
assets/img/f1,f2.jpg  the tilted photo pair at the top
assets/img/g1–g6.jpg  the 3D photo album
assets/img/hero.jpg   social-share preview image
assets/audio/music.mp3
```

## Sections

Envelope cover ("Open") → groom & bride with the tilted photo pair →
announcement → full names → **Save the Date** with the calendar and the day
marked → live countdown → **photo album** → **ceremony** at the church with its
map → **reception** at Pyramids Hall with its map → thank you.

No guestbook, no parents block, no dress code palette.

## The details

| | |
|---|---|
| Groom | Beshoy Nashaat |
| Bride | Meret Bekhet |
| Ceremony | Saint George Coptic Orthodox Church, Faisal, Suez — 7:00 PM |
| Reception | Pyramids Hall, Suez |

## Editing it

**Wording** — open `index.html` and type over the text. Plain HTML, one section
per block, each labelled with a comment.

**Date, venues, maps, music** — the `CONFIG` object at the top of `js/main.js`:

```js
const CONFIG = {
  groom: "Beshoy",
  bride: "Meret",
  event: {
    date: "2026-10-03",
    startTime: "19:00",
    timezone: "Africa/Cairo",
    ...
  },
  maps: {
    church: "29.979913,32.520191",
    hall:   "29.962102,32.554449"
  },
  mapZoom: 16,
  ...
};
```

### About the maps

Both venues use **exact coordinates**, decoded from the two Google Maps links
the couple shared:

- Church — `29.979913, 32.520191` (Diocese of St George the Great Martyr, Faisal)
- Pyramids Hall — `29.962102, 32.554449`

Coordinates are the reliable form. Google's embed honours a zoom level only for
coordinates — give a zoom to a *text* query and it returns a silently blank map.
`main.js` handles that automatically, sending the zoom only when the value looks
like coordinates.

To change a pin: right-click the exact spot in Google Maps and click the numbers
at the top of the menu — that copies the coordinates.

**If you change the date**, also update the three places in `index.html` that
spell it out: the cover, the date block (`Saturday / 3 / October 2026`) and the
footer. The calendar grid redraws itself from `CONFIG.event.date`.

**Colours** — the `:root` variables at the top of `css/styles.css`.

## Previewing locally

```bash
npx serve .
# or
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Publishing

Same as the others — GitHub Pages, or drag the folder onto
<https://app.netlify.com/drop>. Everything is relative paths, so it works from
a subfolder URL too.
