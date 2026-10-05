# CLAUDE.md

## Git usage

- Do not run git commands that change the repository (commit, add, push, pull, merge, rebase, reset, checkout, branch, stash, tag, etc.) unless the user explicitly asks you to.
- Read-only git commands are fine to run at any time (e.g. `git status`, `git log`, `git diff`, `git show`, `git branch --list`, `git remote -v`).

## Project

A rotating 3D globe for a structural engineering office's home page, highlighting countries where they have built projects. The target site is built with Wix (https://paolabozzo1993.wixsite.com/luisbozzo/, white Apple-like design, Inter font, `#1d1d1f` text, `#0071e3` blue). The user can't edit the Wix site yet.

- Status (2026-10-05): waiting for the site manager to invite the user to Wix as a collaborator with editing rights. Hosting decided: GitHub Pages, which requires the user to make the repo (`dani1296/WebEarth3D`, currently private) public. The user signs in to Wix and GitHub themselves; never enter credentials. Test on a hidden Wix page first; publish only with explicit confirmation.
- Integration plan: a split hero. Wix keeps its own headline/buttons on the left; `index.html` (globe only) is hosted as a static site and shown in a Wix "Embed a site" iframe on the right. Settings: `layout: "split"`, theme `"website"`.
- `tools/wix-preview.html` mocks the Wix home page with that iframe; use it to review layout changes. Scrolling over the iframe (wheel and touch, both modes) must keep scrolling the parent page.
- Vanilla HTML/CSS/JS only: no frameworks, no bundler, no npm dependencies at runtime.
- The globe page needs `globe/project-globe.css` plus the six scripts listed in `index.html`.
- Classic `<script>` files that expose globals (`ProjectGlobe`, `PROJECT_COUNTRIES`, `GLOBE_THEMES`, `GLOBE_SETTINGS`, `WORLD_COUNTRIES`), not ES modules.
- `globe/` + `index.html` are what gets hosted; `tools/` is internal only. Theme comparison UI belongs in `tools/theme-picker.html`, never in `globe/` or `index.html`.
- Totals in the caption (`projectsTotal`, `countriesTotal`) are plain text in `settings.js`; there are no per-country project counts.
- All text visitors see is in Spanish (settings, control labels, theme picker UI, console warnings). Code comments and docs stay in English.
- The user is not very familiar with web development: keep user-editable files (`globe/project-countries.js`, `globe/themes.js`) simple and well commented, and explain changes in plain terms.
- `globe/lib/` holds vendored or generated files; don't hand-edit them. Regenerate country data with `node tools/build-world-countries.mjs`.
- `index.html` must keep working when opened straight from disk (file://), since that's how the user previews it. So: no `fetch()` of local files, no ES modules, no image textures loaded by WebGL. Data goes in `.js` files that set a global. If a feature really needs one of those, say so and explain that a local server becomes required.
- Optional server: `node tools/serve.mjs` (http://localhost:8080). The in-app preview pane needs it (it can't run scripts from file://); the `preview` entry in `.claude/launch.json` starts it.
