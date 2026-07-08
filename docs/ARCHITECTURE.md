# GoLucky Architecture

## Role Model

Three parallel identity surfaces — never conflate them.

| Surface | Storage | Purpose |
| --- | --- | --- |
| End users | `auth.users` + `public.profiles` | Wallet, betting, KYC. Agent status lives on `profiles.agent_status`. |
| Staff / Admin | `public.staff_accounts` (role enum: `super_admin`, `finance_admin`, `game_admin`, `agent_admin`, `support`) | Admin panel authentication and RBAC. Roles enumerated in `src/lib/staffRoles.ts` — the single source of truth. |
| Game admin RBAC | `public.user_roles` joined with `staff_accounts` via `has_role()` SECURITY DEFINER | Fine-grained per-game scopes (view / edit / override). |

`'admin'` is **not** a valid `staff_role` — using it silently disables role checks. Always import `STAFF_ROLES` / `isStaffRole` from `@/lib/staffRoles`.

## Wallet RPC Flow

1. Client reads balance from `WalletContext` (backend truth, 10s poll + 5s timeout).
2. Client mutations MUST go through server RPCs:
   - `place_bet_atomic` — atomic deduction + ledger write, per-bet payout capped at ৳500K.
   - `place_aviator_bet_atomic` — aviator variant.
   - `admin_credit_deposit` — approvals, cap ৳50M.
3. Direct client `INSERT`/`UPDATE` on `wallet_transactions` / `wallet_ledger` is blocked by RLS.
4. Every mutation writes an immutable `wallet_ledger` row.

## Route Guard Layers

```
Public route
  └── AuthGuard        (session check, 7s timeout; previewBypass only on `/` and `/home`)
       └── RoleGuard   (GameAdminGuard / admin panel guards use STAFF_ROLES)
            └── Page
```

- `/admin/debug` renders `NotFound` unless `import.meta.env.DEV` is true.
- `GameAdminGuard` gates on `GAME_ADMIN_ALLOWED_ROLES` from `@/lib/staffRoles`.
- Admin session tokens live in memory (see `adminAuthStore`), never `localStorage`.

## Deployment

- **Production app:** Lovable project `goluckybd` — https://goluckybd.lovable.app
- **GitHub mirror:** This repo syncs architecture docs, CI config, and security-critical modules. Full source of truth remains Lovable until full export completes.
