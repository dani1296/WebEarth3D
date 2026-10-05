# CLAUDE.md

## Git usage

- Do not run git commands that change the repository (commit, add, push, pull, merge, rebase, reset, checkout, branch, stash, tag, etc.) unless the user explicitly asks you to.
- Read-only git commands are fine to run at any time (e.g. `git status`, `git log`, `git diff`, `git show`, `git branch --list`, `git remote -v`).

## Project

A rotating 3D globe for a structural engineering office's front page, highlighting countries where they have built projects. It is meant to be dropped into a website whose stack is not decided yet.

- Vanilla HTML/CSS/JS only: no frameworks, no bundler, no npm dependencies at runtime.
- Classic `<script>` files that expose globals (`ProjectGlobe`, `PROJECT_COUNTRIES`, `GLOBE_THEMES`, `WORLD_COUNTRIES`), not ES modules, so embedding stays a matter of copying `globe/` and adding script tags.
- The user is not very familiar with web development: keep user-editable files (`globe/project-countries.js`, `globe/themes.js`) simple and well commented, and explain changes in plain terms.
- `globe/lib/` holds vendored or generated files; don't hand-edit them. Regenerate country data with `node tools/build-world-countries.mjs`.
- `index.html` must keep working when opened straight from disk (file://), since that's how the user previews it. So: no `fetch()` of local files, no ES modules, no image textures loaded by WebGL. Data goes in `.js` files that set a global. If a feature really needs one of those, say so and explain that a local server becomes required.
- Optional server: `node tools/serve.mjs` (http://localhost:8080). The in-app preview pane needs it (it can't run scripts from file://); the `preview` entry in `.claude/launch.json` starts it.
