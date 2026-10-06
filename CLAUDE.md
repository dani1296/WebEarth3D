# CLAUDE.md

## Git usage

- Do not run git commands that change the repository (commit, add, push, pull, merge, rebase, reset, checkout, branch, stash, tag, etc.) unless the user explicitly asks you to.
- Read-only git commands are fine to run at any time (e.g. `git status`, `git log`, `git diff`, `git show`, `git branch --list`, `git remote -v`).

## Project

A rotating 3D globe for a structural engineering office's home page, highlighting countries where they have built projects. The site is built with Wix and live at https://www.luisbozzo.com/ (white Apple-like design, Inter font, `#1d1d1f` text, `#0071e3` blue). The old address paolabozzo1993.wixsite.com/luisbozzo redirects there.

- Status: the repo `dani1296/WebEarth3D` is public and the globe is hosted on GitHub Pages at https://dani1296.github.io/WebEarth3D/ (deployed from `main`, root). The live home page embeds it in every language (confirmed 2026-10-06), so every push to `main` reaches visitors within a minute or two. Verify pushed changes directly on https://www.luisbozzo.com/ (and `/en`, `/ca`, `/ja`); review risky changes in `tools/wix-preview.html` before pushing. The Wix iframe has no `sandbox` attribute, so the globe page may navigate the top page on a user click.
- Wix access: the user has collaborator access but no Wix experience: explain each step. In the Wix site switcher the target is the "Luis Bozzo" site (Light plan), NOT "Slb Devices" (www.slbdevices.com, a different, older live site). We guide via screenshots the user pastes. The built-in browser can't sign in (Google login is blocked there); Claude in Chrome isn't installed yet. The user signs in to Wix and GitHub themselves; never enter credentials. For Wix editor changes, test on a hidden Wix page first; publish only with explicit confirmation.
- Integration: a split hero. Wix keeps its own headline/buttons on the left; `index.html` (globe only) is shown in a Wix "Embed a site" iframe on the right. Settings: `layout: "split"`, theme `"website"`.
- `tools/wix-preview.html` mocks the Wix home page with that iframe; use it to review layout changes. Scrolling over the iframe (wheel and touch, both modes) must keep scrolling the parent page.
- Modes: Automático (spins; the globe layer has `pointer-events: none`; a click on the sphere only switches to Explorar) and Explorar (drag to spin; hovering a country with a page shows the theme's `hoverColor`; clicking it opens `pagesUrl` + its page address from `PROJECT_COUNTRIES` in the top window). Countries without a page (`""`) do nothing. Going back to Automático is only via its button. Hit testing is done in `project-globe.js` against the sphere, not with `globe.toGlobeCoords()` (~5 ms per call, too slow for mouse moves).
- Vanilla HTML/CSS/JS only: no frameworks, no bundler, no npm dependencies at runtime.
- The globe page needs `globe/project-globe.css` plus the six scripts listed in `index.html`.
- Classic `<script>` files that expose globals (`ProjectGlobe`, `PROJECT_COUNTRIES`, `GLOBE_THEMES`, `GLOBE_SETTINGS`, `WORLD_COUNTRIES`), not ES modules.
- `globe/` + `index.html` are what gets hosted; `tools/` is internal only. Theme comparison UI belongs in `tools/theme-picker.html`, never in `globe/` or `index.html`.
- Totals in the caption (`projectsTotal`, `countriesTotal`) are plain text in `settings.js`; there are no per-country project counts.
- Country pages: `luisbozzo.com/<slug>` (Spanish) and `luisbozzo.com/<code>/<slug>` (other languages), e.g. `/mexico`, `/en/mexico`. As of 2026-10-06 only 8 of the 16 highlighted countries have one (mexico, espana, peru, bahrein, bulgaria, chile, filipinas, panama); the rest return 404.
- Main texts are Spanish (settings, control labels, theme picker UI, console warnings). Code comments and docs stay in English.
- Languages: the Wix site has es (main, no prefix), ca, en, ja, at `luisbozzo.com/<code>`, and switching language reloads the page. The globe picks its language from `?lang=<code>` in its own URL; Wix allows a different embed URL per language (confirmed). Per-language overrides live in `GLOBE_SETTINGS.languages`; unknown codes fall back to Spanish with a console warning. Japanese has its own totals without "+" (update them when the totals change). The site's en/ca/ja translations looked outdated (different headline, "7 countries / +70 projects") as of 2026-10-05; that's the site manager's call.
- The user is not very familiar with web development: keep user-editable files (`globe/project-countries.js`, `globe/themes.js`, `globe/settings.js`) simple and well commented, and explain changes in plain terms.
- `globe/lib/` holds vendored or generated files; don't hand-edit them. Regenerate country data with `node tools/build-world-countries.mjs`.
- `index.html` must keep working when opened straight from disk (file://), since that's how the user previews it. So: no `fetch()` of local files, no ES modules, no image textures loaded by WebGL. Data goes in `.js` files that set a global. If a feature really needs one of those, say so and explain that a local server becomes required.
- Optional server: `node tools/serve.mjs` (http://localhost:8080). The in-app preview pane needs it (it can't run scripts from file://); the `preview` entry in `.claude/launch.json` starts it.
