# GoLucky Production Hardening — Implementation Report

**Date:** 2026-07-07  
**Lovable project:** `goluckybd` (`a96058c7-1b97-4e98-a71b-6b6121d46efa`)  
**Live URL:** https://goluckybd.lovable.app  
**GitHub branch:** `cursor/production-hardening-017d`

---

## Phase 1 — Critical Security ✅ COMPLETE

### Changes applied (Lovable)

| Fix | Detail |
|-----|--------|
| `/admin/debug` privilege escalation | Route gated: `import.meta.env.DEV ? <AdminDebugPage /> : <NotFound />` |
| Admin debug mutations removed | No client-side `staff_accounts` upsert/toggle |
| Invalid `'admin'` role | Removed from `GameAdminGuard`; uses `GAME_ADMIN_ALLOWED_ROLES` |
| Duplicate routes | `/admin/kyc` → `KycAdmin` only; `/admin/database` → `DatabaseAdmin` only |
| AuthGuard preview bypass | Limited to `/` and `/home` with `?preview=1` |
| Role SSOT | `src/lib/staffRoles.ts` created |

### Verification

- [x] `staffRoles.ts` mirrors DB `staff_role` enum (5 values)
- [x] Typecheck passes on Lovable
- [x] Production build excludes debug route

See: [IMPLEMENTATION_PHASE1_SECURITY.md](./IMPLEMENTATION_PHASE1_SECURITY.md)

---

## Phase 2 — Mobile Performance ✅ PARTIAL

### Completed

| Item | Implementation |
|------|----------------|
| Reduced motion | `src/hooks/useReducedMotion.ts`, `src/lib/reducedMotion.ts` with `shouldReduceMotion()` |
| Particle caps | `SupportBackground.tsx`, `WithdrawBackground.tsx` — 4 mobile / 8 desktop; skip when reduced motion |
| Realtime cleanup primitive | `src/hooks/useSupabaseChannel.ts` |
| Visibility polling | `src/hooks/useVisibilityAwareInterval.ts` |
| Admin role fallback | `adminAuthStore` default `'support'` not `'admin'` |
| Permissions dedup | `adminPermissions.ts` imports `StaffRole` from `staffRoles.ts`; added `agent_admin` |

### Pending (Phase 2-3 completion in progress)

- [ ] DepositCentre aurora mobile blur reduction
- [ ] TodayStatsStrip → `useVisibilityAwareInterval`
- [ ] WalletContext → `useSupabaseChannel` wiring
- [ ] Cinzel Decorative font lazy-load (VIP only)
- [ ] Image WebP conversion (114 MB assets — separate pass)

---

## Phase 3 — Responsive UI ⏳ IN PROGRESS

### Pending

- [ ] `Lottery.tsx` — Tailwind rewrite (currently inline styles)
- [ ] `TradingAsset.tsx` — responsive chart height
- [ ] `MobileContainer.tsx` — `overflow-x-hidden`
- [ ] `index.css` — `.dc-aurora` mobile opacity

---

## Phase 4 — Architecture ✅ COMPLETE

- [x] `docs/ARCHITECTURE.md` — role model, wallet RPC flow, route guards
- [x] `adminPermissions.ts` aligned with `staffRoles.ts`
- [x] `agent_admin` added to role maps and `RolePermissionManager`

---

## Phase 5 — Database Structure ✅ VERIFIED

**Public tables:** 130+ tables present including all finance, game, agent, and admin tables.

| Domain | Key tables | Status |
|--------|-----------|--------|
| Wallet | `wallets`, `wallet_ledger`, `wallet_transactions`, `wallet_transfers_v2` | ✅ |
| Deposits | `deposit_requests`, `usdt_deposits`, `crypto_deposits` | ✅ |
| Withdrawals | `transaction_requests`, `user_withdrawal_accounts`, `payout_queue` | ✅ |
| Games | `game_bets`, `game_rounds`, `game_results` | ✅ |
| Trading | `trading_assets`, `trade_positions`, `trading_price_snapshots` | ✅ |
| Agent | `agent_applications`, `agent_commissions`, `agent_referrals` | ✅ |
| Staff | `staff_accounts`, `staff_permissions`, `staff_audit_logs` | ✅ |

**RPCs verified:** `place_bet_atomic`, `credit_deposit_atomic`, `agent_transfer_to_user`, `is_admin`, `is_staff`

**Note:** `agent_transfer_to_user` has duplicate overload signatures — consolidate in future migration.

---

## Phase 6 — Authentication & Roles ✅ VERIFIED

| Role | Implementation | Status |
|------|----------------|--------|
| **User** | Supabase Auth + `profiles` (default) | ✅ |
| **Agent** | `profiles.agent_status` + `AgentGate` | ✅ |
| **Staff** | `staff_accounts.staff_role` enum | ✅ |
| **super_admin** | Full permissions in `adminPermissions.ts` | ✅ |

**DB `staff_role` enum:** `super_admin`, `finance_admin`, `agent_admin`, `game_admin`, `support`

**Invalid role removed:** `'admin'` string no longer used as fallback.

---

## Phase 7 — Permissions ✅ VERIFIED

| Layer | Guard | Status |
|-------|-------|--------|
| User routes | `AuthGuard` | ✅ Session + protected route list |
| Admin routes | `AdminLayout` + `useAdminAuth` | ✅ Staff session server-validated |
| Agent routes | `AgentGate` | ✅ `agent_status === 'approved'` |
| Game admin | `GameAdminGuard` | ✅ `GAME_ADMIN_ALLOWED_ROLES` |
| Database RLS | `is_admin()`, `is_staff()`, policies on wallets/profiles/staff | ✅ |

---

## Phase 8 — Finance Systems ✅ VERIFIED

| System | Routes | Backend | Status |
|--------|--------|---------|--------|
| Deposit | `/deposit`, `/wallet?tab=deposit` | PayFastFlow + `credit_deposit_atomic` | ✅ |
| Withdraw | `/withdraw`, `/withdraw/accounts` | `transaction_requests` + admin approval | ✅ |
| Wallet | `/wallet`, `/wallet/workflow` | Dual wallet via RPC; RLS blocks client writes | ✅ |
| Transfer | `/wallet/transfer` | `agent_transfer_to_user`, `wallet_transfers_v2` | ✅ |

**Follow-up:** Backfill `wallet_ledger` from existing `wallet_transactions` before launch.

---

## Phase 9 — Game & Trading Modules ✅ VERIFIED

| Module | Route | Implementation | Status |
|--------|-------|----------------|--------|
| Wingo | `/game/win-go` | ~1,400 LOC, `winGoRoundEngine` | ✅ |
| K3 | `/game/k3` | ~2,300 LOC, `k3RoundEngine` | ✅ |
| 5D | `/game/5d` | ~2,100 LOC | ✅ |
| TRX | `/game/trx-win` | ~1,900 LOC | ✅ |
| Crypto Trading | `/trading`, `/trading/:asset` | 14 active assets in DB + UI | ✅ |

**Lottery hub** (`/lottery`): Game launcher only — Tailwind rewrite pending.

---

## Phase 10 — Repository Sync ⏳ IN PROGRESS

| Item | Status |
|------|--------|
| GitHub placeholder replaced | Partial — config, docs, security modules synced |
| Full `src/**` export | In progress via `.export-tmp/` tooling |
| CI workflows | Present in Lovable; mirrored when export completes |
| README | Updated with Lovable ↔ GitHub relationship |

**Source of truth:** Lovable Cloud until full GitHub mirror completes.

---

## Remaining Priorities

### P0 (before public launch)
1. Complete Phase 2-3 responsive/perf items (Lottery, MobileContainer, fonts)
2. Load testing (500 concurrent bettors)
3. Uptime monitoring + alerting
4. Full GitHub source sync

### P1 (first week)
1. Image WebP compression pass
2. `wallet_ledger` backfill
3. Consolidate `agent_transfer_to_user` RPC overloads
4. Enforce admin TOTP for all super_admin accounts

---

## How to verify locally

```bash
# Lovable project (primary)
# Editor: https://lovable.dev/projects/a96058c7-1b97-4e98-a71b-6b6121d46efa

# GitHub mirror (partial)
bun install
bun run build   # after full src export
bunx tsc --noEmit
```
