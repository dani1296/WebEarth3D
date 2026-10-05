# WebEarth3D

A rotating 3D globe for the home page of the office website (built with Wix), highlighting the countries where we have built projects, with a caption like "+2,000 proyectos en +10 países". All visible text is in Spanish.

Plain HTML, CSS and JavaScript, with no framework and no build step.

## How it fits into the Wix site

The home page will use a **split hero**: Wix's own headline, text and buttons on the left, and the globe on the right (stacked on phones). The globe is a small standalone page, [index.html](index.html). Wix will show it inside an "Embed a site" box, once it's hosted somewhere (e.g. GitHub Pages, Netlify or Cloudflare Pages).

## See it

- **`tools/wix-preview.html`** is a mock of the Wix home page with the split hero and the globe embedded the same way Wix will do it. Use this to review the design.
- **`index.html`** is the globe page on its own, as Wix will embed it.
- **`tools/theme-picker.html`** is our internal tool for comparing themes and speeds. When you change either, it tells you what to write in `settings.js`.

All three work by double-clicking. You can also use a local web server, which behaves more like the real website:

```
node tools/serve.mjs
```

Then open http://localhost:8080/tools/wix-preview.html (or `/` for the globe page, `/tools/theme-picker.html` for the picker).

## Settings

Edit [globe/settings.js](globe/settings.js):

| Setting | What it does |
|---|---|
| `theme` | Which theme from `themes.js` to use. `"website"` matches the Wix site |
| `layout` | `"split"`: caption centred under the globe (for the split hero). `"full"`: text over the globe's bottom left (for a full-width hero) |
| `size` | Globe size as a fraction of the space it has |
| `title` | Caption. `{projects}` and `{countries}` are replaced by the totals below |
| `description` | Optional text under it. Use `""` to hide |
| `projectsTotal` | What `{projects}` shows, written as it should appear, e.g. `"+2,000"` |
| `countriesTotal` | What `{countries}` shows. `"auto"` counts the countries in the list, or write it yourself, e.g. `"+10"` |
| `secondsPerTurn` | Time for one full rotation. 0 = still |
| `allowDragging` | `false` = start spinning by itself; `true` = start in drag mode |
| `showControls` | `true` = show the Automático / Arrastrar buttons and the speed slider |
| `labels` | Wording of those controls |

In **Automático** mode the globe spins by itself; visitors can change the speed with the slider. In **Arrastrar** mode it stops, and visitors spin it by dragging. It never zooms. In both modes, scrolling the page over the globe works normally, with a mouse wheel and with a finger on phones.

## Change the highlighted countries

Edit [globe/project-countries.js](globe/project-countries.js). Use one country per line, written as an English or Spanish name or an ISO code. If a name isn't recognised, a warning appears in the browser console.

## Create or tweak a theme

Edit [globe/themes.js](globe/themes.js). There are two light themes (Website, Paper) and five dark ones (Midnight, Dot Matrix, Blueprint, Ember, Hologram). Copy a theme, give it a new key and change the colours. It shows up in the theme picker automatically. Each option is explained at the top of that file. Light backgrounds are detected automatically, so the text and controls switch to dark colours. The text size and layout of the caption and controls are in [globe/project-globe.css](globe/project-globe.css).

## Folder layout

```
index.html                    the globe page that Wix will embed
globe/                        <- everything the globe page needs
  settings.js                 theme, layout, text, totals, speed  <- edit
  project-countries.js        the highlighted countries           <- edit
  themes.js                   the available themes                <- edit
  project-globe.css           layout of the caption and controls
  project-globe.js            the globe code
  lib/globe.gl.min.js         3D globe library, v2.46.2 (MIT licence)
  lib/world-countries.js      country borders (generated, don't edit)
tools/                        <- internal only, not part of the website
  wix-preview.html            mock of the Wix home page with the split hero
  theme-picker.html           compare themes and speeds
  serve.mjs                   local preview server
  build-world-countries.mjs   regenerates lib/world-countries.js
```

Country borders come from [Natural Earth](https://www.naturalearthdata.com/) and are in the public domain. The Inter font is loaded from Google Fonts.
