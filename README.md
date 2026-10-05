# WebEarth3D

A rotating 3D globe for the front page of the office website. It highlights the countries where we have built projects, with a title, a short description and the number of countries shown over it.

Plain HTML, CSS and JavaScript, with no framework and no build step, so it can be added to any website.

## See it

- **`index.html`** shows the globe exactly as it will look on the website. Double-click it to open it in Chrome.
- **`tools/theme-picker.html`** is our internal tool for choosing the look. It has a button per theme (the left/right arrow keys also switch) and always shows the speed slider. When you change either, it tells you what to write in `settings.js`. It is not part of the website.

Both work by double-clicking. You can also use a local web server, which behaves more like the real website:

```
node tools/serve.mjs
```

Then open http://localhost:8080 for the website view or http://localhost:8080/tools/theme-picker.html for the picker.

## Settings: theme, text, movement

Edit [globe/settings.js](globe/settings.js):

| Setting | What it does |
|---|---|
| `theme` | Which theme from `themes.js` the website uses |
| `size` | Globe size as a fraction of the space it sits in (0.8 = 80%) |
| `title` | Heading over the globe. `{count}` is replaced by the number of countries |
| `description` | Short text under the heading (`{count}` works here too). Use `""` to hide |
| `secondsPerTurn` | Time for one full rotation. 0 = still |
| `allowDragging` | `false` = start spinning by itself; `true` = start in drag mode |
| `showControls` | `true` = show the Auto-rotate / Drag buttons and the speed slider |
| `labels` | Wording of those controls, e.g. for a Spanish version |

In **Auto-rotate** mode the globe spins by itself; visitors can change the speed with the slider, and scrolling the page over the globe works normally. In **Drag** mode it stops, and visitors spin it by dragging. It never zooms.

## Change the highlighted countries

Edit [globe/project-countries.js](globe/project-countries.js). Use one country per line, written as an English or Spanish name or an ISO code. If a name isn't recognised, a warning appears in the browser console.

## Create or tweak a theme

Edit [globe/themes.js](globe/themes.js). Copy a theme, give it a new key and change the colours. It shows up in the theme picker automatically. Each option is explained at the top of that file. The text size and layout of the title and controls are in [globe/project-globe.css](globe/project-globe.css).

## Add it to a website

Copy the `globe/` folder into the site, then add this to the page:

```html
<link rel="stylesheet" href="globe/project-globe.css">

<div id="hero-globe" style="height: 100vh"></div>

<script defer src="globe/lib/globe.gl.min.js"></script>
<script defer src="globe/lib/world-countries.js"></script>
<script defer src="globe/project-countries.js"></script>
<script defer src="globe/themes.js"></script>
<script defer src="globe/settings.js"></script>
<script defer src="globe/project-globe.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    ProjectGlobe.create(document.getElementById("hero-globe"));
  });
</script>
```

The title and controls use the website's own font.

## Folder layout

```
index.html                    the globe as it will appear on the website
globe/                        <- everything the website needs
  settings.js                 theme, text, speed, controls       <- edit
  project-countries.js        the highlighted countries          <- edit
  themes.js                   the available themes               <- edit
  project-globe.css           layout of the title and controls
  project-globe.js            the globe code
  lib/globe.gl.min.js         3D globe library, v2.46.2 (MIT licence)
  lib/world-countries.js      country borders (generated, don't edit)
tools/                        <- internal only, not for the website
  theme-picker.html           compare themes and speeds
  serve.mjs                   local preview server
  build-world-countries.mjs   regenerates lib/world-countries.js
```

Country borders come from [Natural Earth](https://www.naturalearthdata.com/) and are in the public domain.
