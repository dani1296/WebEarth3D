# WebEarth3D

A rotating 3D globe for the front page of the office website. It highlights the countries where we have built projects.

Plain HTML, CSS and JavaScript, with no framework and no build step, so it can be added to any website.

## See it

- **`index.html`** shows the globe exactly as it will look on the website. Double-click it to open it in Chrome.
- **`tools/theme-picker.html`** is our internal tool for comparing themes. It has a button per theme (the left/right arrow keys also switch), shows which theme the website uses, and has an "Allow dragging" toggle. It is not part of the website.

Both work by double-clicking. You can also use a local web server, which behaves more like the real website:

```
node tools/serve.mjs
```

Then open http://localhost:8080 for the website view or http://localhost:8080/tools/theme-picker.html for the picker.

## Choose the theme and other settings

Edit [globe/settings.js](globe/settings.js):

| Setting | Default | What it does |
|---|---|---|
| `theme` | `"midnight"` | Which theme from `themes.js` the website uses |
| `secondsPerTurn` | `60` | Time for one full rotation |
| `allowDragging` | `false` | `true` lets visitors drag to spin it (never zoom) |
| `size` | `0.8` | Globe size as a fraction of the space it sits in |

## Change the highlighted countries

Edit [globe/project-countries.js](globe/project-countries.js). Use one country per line, written as an English or Spanish name or an ISO code. If a name isn't recognised, a warning appears in the browser console.

## Create or tweak a theme

Edit [globe/themes.js](globe/themes.js). Copy a theme, give it a new key and change the colours. It shows up in the theme picker automatically. Each option is explained at the top of that file.

## Add it to a website

Copy the `globe/` folder into the site, then add this to the page:

```html
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

## Folder layout

```
index.html                    the globe as it will appear on the website
globe/                        <- everything the website needs
  settings.js                 which theme to use, speed, etc.  <- edit
  project-countries.js        the highlighted countries        <- edit
  themes.js                   the available themes             <- edit
  project-globe.js            the globe code
  lib/globe.gl.min.js         3D globe library, v2.46.2 (MIT licence)
  lib/world-countries.js      country borders (generated, don't edit)
tools/                        <- internal only, not for the website
  theme-picker.html           compare themes side by side
  serve.mjs                   local preview server
  build-world-countries.mjs   regenerates lib/world-countries.js
```

Country borders come from [Natural Earth](https://www.naturalearthdata.com/) and are in the public domain.
