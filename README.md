# GoLucky BD — GitHub Mirror (Pending Sync)

The full **GoLucky Official Apps BD** application lives in [Lovable](https://lovable.dev/projects/a96058c7-1b97-4e98-a71b-6b6121d46efa) and is published at **https://goluckybd.lovable.app**.

The intended GitHub home is **`goluckybd01-coder/goluckybd`**, but that repository does not exist yet. This repo (`goluckybd01-coder/golucky`) currently holds only a placeholder page and sync documentation until the Lovable → GitHub connection is completed.

## Project at a glance

| Item | Value |
| --- | --- |
| Lovable project | `goluckybd` — GoLucky Official Apps BD |
| Project ID | `a96058c7-1b97-4e98-a71b-6b6121d46efa` |
| Workspace | ALHAMDULLAH GOLUCKY LIVE |
| Stack | Vite + React + TypeScript + shadcn/ui + Supabase |
| Live preview | https://goluckybd.lovable.app |
| Target GitHub repo | https://github.com/goluckybd01-coder/goluckybd *(create this)* |

## What you need to do (one-time)

1. **Create** an empty public repo: `goluckybd01-coder/goluckybd` (no README, no `.gitignore`).
2. **Connect Lovable to GitHub** in the [project editor](https://lovable.dev/projects/a96058c7-1b97-4e98-a71b-6b6121d46efa) → **GitHub → Connect to GitHub** → authorize the Lovable GitHub App → select `goluckybd`.
3. **Verify** after the first push:
   ```bash
   git clone https://github.com/goluckybd01-coder/goluckybd.git && cd goluckybd
   npm ci && npm run lint && npm run build
   ```

See [FINAL_SYNC_REPORT.md](./FINAL_SYNC_REPORT.md) for the full audit (routes, Supabase, admin/wallet/games coverage) and troubleshooting.

## Open issues

- [#5 Login Page Not Loading Properly](https://github.com/goluckybd01-coder/golucky/issues/5) — dashboard/login issues reported during initial testing; requires the full synced codebase to reproduce and fix in GitHub.

## Current repo contents

Until sync completes, `main` contains only a static stub (`index.html`). Do **not** treat partial files on other branches as the application source — they are incomplete snapshots with broken imports.
