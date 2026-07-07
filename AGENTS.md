# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
This is a single static HTML page (`index.html`, currently just `<h1>GoLucky Live</h1>`). There is no package manager, build step, test suite, or lint config — do not look for `package.json`, `node_modules`, or a bundler.

### Running it (dev)
Serve the repo root over HTTP from `/workspace` and open the page:

```
python3 -m http.server 8000
```

Then browse to `http://localhost:8000/` — the page should render the "GoLucky Live" heading. `python3` is preinstalled; no dependency install is required.

### Lint / test / build
There are none. There is nothing to install, compile, or test until real tooling is added to the repo. If a `package.json` (or similar) is later added, install its dependencies and use its scripts instead of the static server above.
