# Phase 1 — Critical Security Hardening

**Status:** ✅ Complete (repository + Lovable sync, 2026-07-07)

## Summary

| Area | Change |
| --- | --- |
| `/admin/debug` route | Gated behind `import.meta.env.DEV`; renders `NotFound` in production. |
| `AdminDebugPage` | Removed self-service `handleUpsertStaffAccount` + `handleToggleActive` mutation buttons. Added DEV-only banner. Admin-Access badge uses `isStaffRole(...)`. |
| `GameAdminGuard` | Uses `GAME_ADMIN_ALLOWED_ROLES` from `@/lib/staffRoles`; removed invalid `'admin'` string. |
| `AuthGuard` | `previewBypass` limited to `/` and `/home` only. |
| Duplicate routes | Removed duplicate `/admin/kyc` (SecurityCenter) and `/admin/database` (SuperAdminPage) in `App.tsx`. |
| Role source of truth | New `src/lib/staffRoles.ts` mirroring DB enum. `adminAuthStore` fallback role `'support'` (least privilege). |

## Files changed

- `src/lib/staffRoles.ts` (new)
- `src/App.tsx`
- `src/components/AuthGuard.tsx`
- `src/components/game-admin/GameAdminGuard.tsx`
- `src/pages/admin/AdminDebugPage.tsx`

## Verification

- Typecheck passes on Lovable (`tsgo --noEmit`)
- Production build strips `/admin/debug` route (Vite `import.meta.env.DEV` dead-code elimination)
