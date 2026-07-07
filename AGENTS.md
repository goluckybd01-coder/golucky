# AGENTS.md

## Cursor Cloud specific instructions

This repository is a single static HTML site (`index.html`, currently just `<h1>GoLucky Live</h1>`). There is no package manager, build system, dependency manifest, test suite, or lint configuration.

- **No dependencies to install.** The update script only checks that Python 3 is present; nothing needs to be fetched.
- **Run (development):** serve the static files with Python's built-in server from the repo root:
  `python3 -m http.server 8000`
  Then open `http://localhost:8000/`. Any static file server works (e.g. `npx serve`); Python is used because it needs no install.
- **No lint/test/build steps exist.** Do not invent them unless the task adds tooling. The GitHub Actions workflow `.github/workflows/main.yml` is empty, and `codeql.yml` only runs CodeQL analysis on GitHub (not runnable as a local dev command).
- Python's `http.server` does not hot-reload, but it re-reads files on each request, so edits to `index.html` appear on browser refresh with no restart needed.
