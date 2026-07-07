# GoLucky — Repository Synchronization Report (GitHub ↔ Lovable)

**Date:** 2026-07-07
**Requested target:** `goluckybd01-coder/goluckybd`
**Mode:** Read-only verification. No application code modified.

---

## 0. Executive Summary — CRITICAL

Two blocking facts make the requested repo-vs-Lovable comparison resolve to **"almost nothing is synced":**

1. **The GitHub repository `goluckybd01-coder/goluckybd` does not exist.** The GitHub API returns `404 / Could not resolve to a Repository`. No repo under that owner is named `goluckybd`.
2. **`goluckybd` is the Lovable project slug, not a GitHub repo.** The source of truth is the Lovable project **`goluckybd`** ("GoLucky Official Apps BD", id `a96058c7-1b97-4e98-a71b-6b6121d46efa`, workspace *ALHAMDULLAH GOLUCKY LIVE*, 1360 edits, last edited 2026-07-07, `https://goluckybd.lovable.app`). It is a **complete Vite + React + TypeScript + shadcn app**.

The GitHub repos that actually exist under `goluckybd01-coder` contain **only a placeholder** — none contain the application:

| GitHub repo | Max files (any branch) | Contents |
| --- | --- | --- |
| `golucky` | 17 (`cursor/production-hardening-017d`) | `index.html` stub + **7 orphan files** (5 `src/*`, 2 `docs/*`); other branches = 8-file stub |
| `golucky-superapp09` | 8 | Same stub as `golucky` (index.html/README/SECURITY/.github) |
| `golucky-superapps` | 1 | README only |
| `goluckyapps` | 1 | README only |
| `golucky-superapp` | 0 | Empty repo |
| `golucky-supera` | 0 | Empty repo |
| `NovaFi-Wallet` | 1 | README only |
| **`goluckybd`** | **—** | **Does not exist** |

**Overall sync status: ~0%.** The Lovable project has **hundreds of files** (full `src/`, `supabase/`, `e2e/`, `public/`, 70+ CI workflows). GitHub has **7** application-relevant files, and even those are **stale/divergent** (see §Broken imports). Effectively the *entire* application exists **only in Lovable** and is **missing from GitHub**.

> Because there is no populated GitHub app repo, every subsequent section reports the Lovable inventory as **"present in Lovable / MISSING in GitHub."**

---

## 1. Total Pages and Routes

**Source of truth:** Lovable `src/App.tsx` (read directly).

- **Route entries:** ~**190** `<Route>` definitions (public/auth, main app, admin, game-admin, dev/preview).
- **Page modules imported:** ~**175** (`lazy(() => import("./pages/..."))` + eager `NotFound`).
- Route groups:
  - **Auth/public:** `/login`, `/register`, `/auth/callback`, `/forgot-password`, `/reset-password`, `/welcome`, `/install`, `/deposit`, `/withdraw`, `/withdraw/accounts`, `/verify/deposit/:orderId`.
  - **Main app (via `MainLayout`):** `/home`, `/activity`, `/promotion`, `/wallet` (+6 sub-routes), `/account/:tab`, `/vip`, `/gifts`, `/leaderboard`, `/lucky-hub`, `/fixed-deposits`, `/rewards` (+checkin/spin), `/agent` (+apply/register/dashboard/payment…), games, trading, etc.
  - **Admin (`/admin/*` via `AdminLayout`):** ~**90** routes.
  - **Game Admin (`/game-admin/*` via `GameAdminGuard`):** ~**13** routes.

**GitHub:** `golucky@cursor/production-hardening-017d` has a **trimmed `App.tsx` with only 3 routes** (`/`, `/login`, `/home`). **~187 routes / ~172 page modules missing from GitHub.**

## 2. Total React Components

- **Lovable:** Large component tree under `src/components/**` (shadcn/ui primitives in `src/components/ui/*` + feature components: `AuthGuard`, `MainLayout`, `AdminLayout`, `AdminUniversalNav`, `MobileContainer`, `WalletContext` provider, `GameErrorBoundary`, `ChunkErrorBoundary`, `game-admin/GameAdminGuard`, `agent/AgentGate`, `debug/*`, `dev/*`, etc.). Order of **hundreds** of `.tsx` components (exact count not fully enumerable via API here due to the very large `public/game-logos/**` asset tree, but directory evidence is conclusive).
- **GitHub:** **2** component files exist (`src/components/AuthGuard.tsx`, `src/components/game-admin/GameAdminGuard.tsx`). Every other component is **MISSING**.

## 3. Supabase Integrations

- **Lovable:** `@supabase/supabase-js@^2.90.1` dependency; client at `src/integrations/supabase/client`; Supabase **edge functions** invoked (e.g. `admin-check-otp`); tables referenced (`user_roles`, `staff_accounts`, …); dedicated CI: `rls-integration.yml`, `super-admin-integrity.yml`, `security-scan.yml`, `security-gate.yml`. A `supabase/` backend (migrations/functions/policies) is part of the Lovable project.
- **GitHub:** **No** `@supabase/supabase-js`, **no** `src/integrations/supabase/`, **no** `supabase/` directory, **no** migrations/edge functions. Supabase integration is **entirely MISSING** from GitHub. (The 5 orphan files reference `@/integrations/supabase/client`, which does not exist in the repo → broken import.)

## 4. Admin Panel Files

- **Lovable:** ~**61** admin page modules under `src/pages/admin/**` + `src/components/admin/**` (`AdminLayout`, `AdminUniversalNav`). Examples: `PremiumAdminDashboard`, `FinancialDashboard`, `NewUsersPage`, `AdminAgentsPage`, `PremiumDepositsPage`, `PremiumWithdrawsPage`, `WithdrawalAccountsAdmin`, `NewTransactionsPage`, `DualWalletOverview`, `UsdtDepositsAdmin`, `UsdtRateAdmin`, `FdAdminDashboard`, `KycAdmin`, `AdminRolesPage`, `SuperAdminPage`, `SecurityCenter`, `AdminCryptoTradingControlPage`, `AdminPaymentGatewayManagerPage`, `WinGoGameAdmin`, `K3GameAdmin`, `FiveDGameAdmin`, `TrxWinGameAdmin`, `AviatorGameAdmin`, `CrashGameAdmin`, `MinesGameAdmin`, `PayoutAuditLogs`, `AdminAuditLogsPage`, …
- **GitHub:** Only `src/pages/admin/AdminDebugPage.tsx` (DEV-only diagnostics) exists. **~60 admin pages + admin layout/nav MISSING.**

## 5. Agent Panel Files

- **Lovable:** `src/pages/AgentApply`, `AgentRegister`, `AgentPayment`, `AgentPaymentStatus`, `AgentDashboard`; `src/components/agent/AgentGate`; admin side `src/pages/admin/AgentPayments`, `AgentCommissionAdmin`, `AdminAgentsPage`, `AdminAgentUsdtDepositPage`; wallet `WalletAgentTransfer`.
- **GitHub:** **None.** Entire agent system **MISSING**.

## 6. User Dashboard Files

- **Lovable:** `HomeCmsGate`/`HomeMobile`/`HomeDesktop`, `Activity`, `Promotion`, `ProfileCmsGate` (`/account/:tab`), `VIP`, `Gifts`, `Leaderboard`, `Achievements`, `Challenges`, `Cashback`, `Notifications`, `Settings`(+`BadgeSettings`), `PersonalInformation`, `GameHistory`, `GameStats`, `AIPredictionDashboard`, `AIChat`, `RewardsCmsGate`, etc.
- **GitHub:** Only a trimmed `Home` route wired in `App.tsx`; **no page files present.** User dashboard **MISSING**.

## 7. Wallet System Files

- **Lovable:** `src/context/WalletContext` (`WalletProvider`); `src/pages/WalletCmsGate`; `src/pages/wallet/` → `WalletCenter`, `WalletThirdParty`, `WalletAgentTransfer`, `WalletAnalytics`, `WalletTransactionHistory`, `WalletSecurity`; admin `DualWalletOverview`; extensive wallet CI + `.lovable/memory/features/wallet-and-payments/*` locks + `e2e/wallet-*`.
- **GitHub:** **None.** Wallet system **MISSING**.

## 8. Deposit System Files

- **Lovable:** `src/pages/DepositCentre`, `src/pages/VerifyDeposit`, admin `AdminDepositCentrePage`, `AdminDepositControlPage`, `PremiumDepositsPage`, `UsdtDepositsAdmin`, `AdminAgentUsdtDepositPage`; `public/deposit-centre.html`; `src/components/VerifyDepositErrorBoundary`; `e2e/deposit-*`, `docs/*deposit*`.
- **GitHub:** **None** (route strings only). Deposit system **MISSING**.

## 9. Withdraw System Files

- **Lovable:** `src/pages/Withdraw`, `src/pages/WithdrawAccounts`, admin `PremiumWithdrawsPage`, `WithdrawalAccountsAdmin`.
- **GitHub:** **None.** Withdraw system **MISSING**.

## 10. Wingo / K3 / 5D / TRX Modules

- **Lovable game pages** (`src/pages/games/`): `WinGo`, `K3`, `FiveD`, `TrxWin` (+ `MotoRace`, `VideoWinGo`, `CrashGame`, `MinesGame`, `AviatorGame`).
- **Game admin** (`src/pages/admin/`): `WinGoGameAdmin`, `K3GameAdmin`, `FiveDGameAdmin`, `TrxWinGameAdmin`, `UnifiedGameAdmin` + `/game-admin/*` routes.
- **Engine redirects:** `/engine/wingo|k3|trx|5d` → canonical game pages. **Assets:** `public/assets/images/games/{wingo,k3,5d,trxwin}*.png`. **CI:** `engine-tests.yml`. **Crypto Trading:** `Trading`, `TradingPro`, `TradingAsset`, `TradingMarkets`, `BinaryTrading`, `TokenDetail`, admin `AdminCryptoTradingControlPage`.
- **GitHub:** **None** of these files exist. All game/trading modules **MISSING**.

---

## Missing Folders (present in Lovable, absent in GitHub)

`src/` (entire app tree: `pages/`, `pages/admin/`, `pages/games/`, `pages/game-admin/`, `pages/wallet/`, `components/`, `components/ui/`, `components/admin/`, `components/agent/`, `context/`, `hooks/`, `lib/`, `integrations/supabase/`), `supabase/` (migrations/functions/policies), `public/` (assets, game-logos, static games), `e2e/` (150+ specs), `docs/` (30+), `.storybook/`, `.lovable/`, `.githooks/`, `scripts/`, `artifacts/`.

## Missing Root Files (present in Lovable, absent in GitHub)

`package.json`, `package-lock.json`, `bun.lockb`, `vite.config.ts`*, `tsconfig*.json`*, `tailwind.config.*`*, `postcss.config.js`, `eslint.config.js`, `components.json`, `index.html` (real app entry), `playwright.config.ts`, `playwright.e2e.config.ts`, `codecov.yml`, plus **70+** `.github/workflows/*.yml`.
<br>*(`vite.config`/`tsconfig`/`tailwind.config` were not individually enumerated via the API but are mandatory for this stack and confirmed by `package.json` scripts.)*

## Broken Imports (in what little GitHub *does* contain)

The 7 orphan files on `golucky@cursor/production-hardening-017d` are **not buildable** — every import resolves to a **missing** module:
- `@/integrations/supabase/client`, `@/context/WalletContext`, `@/components/ui/*` (toaster, sonner, tooltip, button, card, badge), `./components/MainLayout`, `./components/admin/AdminLayout`, `./components/MobileContainer`, `./pages/HomeCmsGate`, `./pages/Login`, `./pages/Register`, `./pages/AuthCallback`, `@sentry/react`, `sonner`, `react-router-dom`, `@tanstack/react-query`, `lucide-react`, and ~150 lazy page imports — **none present** in the repo (no `package.json`, no `node_modules`, no `src/pages/*`).
- **Divergence:** GitHub `App.tsx` (3 routes) is a **stale/trimmed** copy of Lovable `App.tsx` (~190 routes) — even the "synced" file does not match Lovable.

## Unsynced Lovable Files / Files in Lovable but not in GitHub

**Essentially the entire project.** Only these Lovable paths have a counterpart in GitHub (`cursor/production-hardening-017d`), and 1 of them is stale:
`src/components/AuthGuard.tsx`, `src/components/game-admin/GameAdminGuard.tsx`, `src/lib/globalErrorHandlers.ts`, `src/lib/sentry.ts`, `src/lib/staffRoles.ts`, `src/pages/admin/AdminDebugPage.tsx`, `src/App.tsx` *(stale)*, `docs/IMPLEMENTATION_PHASE1_SECURITY.md`.
**All other Lovable files (hundreds) are unsynced / missing from GitHub.**

---

## Verdict & Required Actions

**Synchronization: FAILED (~0%).** The GitHub repository is not a mirror of the Lovable project; it is an empty placeholder.

1. **Confirm the intended GitHub repo.** `goluckybd01-coder/goluckybd` does not exist. Either create it or specify which existing repo (`golucky`, `golucky-superapp`, …) should be the mirror.
2. **Perform a full initial sync from Lovable → GitHub** using Lovable's built-in GitHub integration (Lovable → Project → GitHub → Connect/Push). This must push the entire tree: `package.json` + lockfiles, all config, `src/`, `supabase/`, `public/`, `e2e/`, `.github/workflows/`.
3. **Verify post-sync:** fresh clone builds (`npm ci && npm run build`), typecheck, lint, and Playwright all run; route count in `App.tsx` matches (~190); admin (~61), games (Wingo/K3/5D/TRX + trading), wallet, deposit, withdraw, agent files all present.
4. **Then** re-run this comparison to confirm file-for-file parity.

### Appendix — Methodology
- GitHub: `gh api` on all repos/branches under `goluckybd01-coder`; counted blobs per branch via git trees.
- Lovable: `Lovable` MCP — `list_workspaces` → located project `goluckybd` (`a96058c7-…`); `list_files` (paginated) for the tree; `read_file` on `src/App.tsx` and `package.json` for authoritative route/dependency data.
- Full component/`supabase/` file-by-file counts were bounded (the `public/game-logos/**` asset tree is very large and the list API cursor is non-seekable); directory-level presence is nonetheless conclusive.
