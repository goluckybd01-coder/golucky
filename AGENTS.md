# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is (today)

`goluckybd01-coder/golucky` is a **placeholder** until `goluckybd01-coder/goluckybd` is created and synced from Lovable. The real app is the Lovable project **goluckybd** (`a96058c7-1b97-4e98-a71b-6b6121d46efa`).

On `main`, there is only a static `index.html` (`<h1>GoLucky Live</h1>`). No `package.json`, build, or tests exist yet.

### After Lovable → GitHub sync

When `goluckybd` contains the full Vite tree:

```bash
npm ci
npm run dev          # http://localhost:5173
npm run lint
npm run build
npm run test:visual  # Playwright (install browsers first)
```

Environment: copy `.env` from Lovable/Supabase dashboard. The app uses `@supabase/supabase-js` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Do not

- Patch imports on partial `cursor/production-hardening-*` branches — they are orphan snapshots.
- Copy Lovable files file-by-file via MCP — binary assets will be corrupted.
- Assume `golucky` and `goluckybd` are the same repo; the target is **`goluckybd`**.

### Sync blocked?

See [FINAL_SYNC_REPORT.md](./FINAL_SYNC_REPORT.md). Owner must create `goluckybd` on GitHub and connect it in the Lovable project settings.
