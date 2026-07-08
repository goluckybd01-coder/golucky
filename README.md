# GoLucky Official Apps BD

Production gaming and crypto-trading platform for Bangladesh.

## Live application

- **Production:** https://goluckybd.lovable.app
- **Source of truth:** [Lovable project `goluckybd`](https://lovable.dev/projects/a96058c7-1b97-4e98-a71b-6b6121d46efa)

## Repository layout

This GitHub repo mirrors the Lovable project for CI, documentation, and version control. The full application codebase is deployed from Lovable Cloud (Supabase backend).

| Path | Purpose |
|------|---------|
| `docs/` | Architecture and implementation reports |
| `src/lib/staffRoles.ts` | Staff role single source of truth |
| `.github/workflows/` | Build, lint, typecheck CI |
| `package.json` | Dependency manifest (sync with Lovable) |

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Hosting:** Lovable

## Development

```bash
bun install
bun run dev      # requires full src export from Lovable
bun run build
bun run lint
bunx tsc --noEmit
```

## Documentation

- [Implementation Report](docs/IMPLEMENTATION_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Phase 1 Security](docs/IMPLEMENTATION_PHASE1_SECURITY.md)

## Production hardening (2026-07-07)

Critical security fixes applied:

- `/admin/debug` gated to development builds only
- Staff role privilege escalation vector removed
- Route guard and permission system aligned with DB enums

See `docs/IMPLEMENTATION_REPORT.md` for full audit and status.
