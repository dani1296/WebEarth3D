# WebEarth3D

A rotating 3D globe for the front page of the office website. It highlights the countries where we have built projects.

Plain HTML, CSS and JavaScript, with no framework and no build step, so it can be added to any website.

## Preview it

Double-click `index.html` to open it in Chrome (or any modern browser). The buttons at the bottom switch between themes, and the left/right arrow keys do the same.

If you'd rather use a local web server, which behaves more like the real website, run:

```
node tools/serve.mjs
```

and open http://localhost:8080. The address bar then remembers the theme you picked, e.g. `?theme=blueprint`.

## Change the highlighted countries

Edit [globe/project-countries.js](globe/project-countries.js). Use one country per line, written as an English or Spanish name or an ISO code. If a name isn't recognised, a warning appears in the browser console.

## Try a new style

Edit [globe/themes.js](globe/themes.js). Copy a theme, give it a new key and change the colours. It shows up in the preview buttons automatically. Each option is explained at the top of that file.

## Add it to a website

Copy the `globe/` folder into the site, then add this to the page:

```html
<div id="hero-globe" style="height: 100vh"></div>

<script defer src="globe/lib/globe.gl.min.js"></script>
<script defer src="globe/lib/world-countries.js"></script>
<script defer src="globe/project-countries.js"></script>
<script defer src="globe/themes.js"></script>
<script defer src="globe/project-globe.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    ProjectGlobe.create(document.getElementById("hero-globe"), { theme: "midnight" });
  });
</script>
```

Other options for `ProjectGlobe.create` (all optional):

| Option | Default | What it does |
|---|---|---|
| `theme` | `"midnight"` | Theme key from `themes.js` |
| `secondsPerTurn` | `60` | Time for one full rotation |
| `interactive` | `false` | `true` lets visitors drag to spin it (never zoom) |
| `size` | `0.8` | Globe size as a fraction of the container's shorter side |
| `view` | `{ lat: 22, lng: 0 }` | Starting tilt and longitude |

## Folder layout

```
index.html                    preview page (only for choosing a theme)
globe/
  project-countries.js        the highlighted countries   <- edit
  themes.js                   the visual themes           <- edit
  project-globe.js            the globe code
  lib/globe.gl.min.js         3D globe library, v2.46.2 (MIT licence)
  lib/world-countries.js      country borders (generated, don't edit)
tools/
  serve.mjs                   local preview server
  build-world-countries.mjs   regenerates lib/world-countries.js
```

Country borders come from [Natural Earth](https://www.naturalearthdata.com/) and are in the public domain.
