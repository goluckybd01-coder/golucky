import { lazy, Suspense } from "react";
import HomeSkeleton from "./components/HomeSkeleton";
import { Toaster } from "@/components/ui/toaster";
import DemoModeBanner from "@/components/DemoModeBanner";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ScrollRestoration } from "@/components/ScrollRestoration";

function RedirectToTrading() {
  const { asset } = useParams();
  return <Navigate to={`/trading/${asset || ""}`} replace />;
}
import { WalletProvider } from "@/context/WalletContext";
import AuthGuard from "./components/AuthGuard";
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/admin/AdminLayout";
import MobileContainer from "./components/MobileContainer";
import ClickDebugOverlay from "./components/debug/ClickDebugOverlay";
import PortraitLock from "./components/PortraitLock";
const TapTargetDebug = lazy(() => import("./components/dev/TapTargetDebug"));
// Eager imports — error pages must load instantly
import NotFound from "./pages/NotFound";
// Lazy auth pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
import VerifyDepositErrorBoundary from "./components/VerifyDepositErrorBoundary";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";

const LuckyHubThemePreview = lazy(() => import("./pages/dev/LuckyHubThemePreview"));
const TxProgressHarness = lazy(() => import("./pages/__dev/TxProgressHarness"));
const SentryTest = lazy(() => import("./pages/SentryTest"));
import GameAdminGuard from "./components/game-admin/GameAdminGuard";
import AdminUniversalNav from "./components/admin/AdminUniversalNav";

// Lazy-loaded pages
const Welcome = lazy(() => import("./pages/Welcome"));
const Home = lazy(() => import("./pages/HomeCmsGate"));
const HomeMobilePreview = lazy(() => import("./pages/HomeMobile"));
const HomeDesktopPreview = lazy(() => import("./pages/HomeDesktop"));
const Activity = lazy(() => import("./pages/Activity"));
const Promotion = lazy(() => import("./pages/Promotion"));
const Wallet = lazy(() => import("./pages/WalletCmsGate"));
const WalletWorkflow = lazy(() => import("./pages/wallet/WalletCenter"));
const FixedDeposits = lazy(() => import("./pages/FixedDeposits"));
const RewardsCentre = lazy(() => import("./pages/RewardsCmsGate"));
const CheckIn = lazy(() => import("./pages/phase2/CheckIn"));
const SpinWin = lazy(() => import("./pages/phase2/SpinWin"));
const WalletThirdParty = lazy(() => import("./pages/wallet/WalletThirdParty"));
const WalletAgentTransfer = lazy(() => import("./pages/wallet/WalletAgentTransfer"));
const WalletAnalytics = lazy(() => import("./pages/wallet/WalletAnalytics"));
const WalletTransactionHistory = lazy(() => import("./pages/wallet/WalletTransactionHistory"));
const WalletSecurity = lazy(() => import("./pages/wallet/WalletSecurity"));
const Account = lazy(() => import("./pages/ProfileCmsGate"));
const PremiumAdminDashboard = lazy(() => import("./pages/admin/PremiumAdminDashboard"));
const DashboardOverview = lazy(() => import("./pages/admin/DashboardOverview"));
const FinancialDashboard = lazy(() => import("./pages/admin/FinancialDashboard"));
const InternalAssetPrices = lazy(() => import("./pages/admin/InternalAssetPrices"));
const NewUsersPage = lazy(() => import("./pages/admin/NewUsersPage"));
const AdminAgentsPage = lazy(() => import("./pages/admin/AdminAgentsPage"));
const PremiumDepositsPage = lazy(() => import("./pages/admin/PremiumDepositsPage"));
const PremiumWithdrawsPage = lazy(() => import("./pages/admin/PremiumWithdrawsPage"));
const WithdrawalAccountsAdmin = lazy(() => import("./pages/admin/WithdrawalAccountsAdmin"));
const NewTransactionsPage = lazy(() => import("./pages/admin/NewTransactionsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const BannersAdmin = lazy(() => import("./pages/admin/BannersAdmin"));
const AnnouncementsAdmin = lazy(() => import("./pages/admin/AnnouncementsAdmin"));
const SupportChatAdmin = lazy(() => import("./pages/admin/SupportChatAdmin"));
const AgentCommissionAdmin = lazy(() => import("./pages/admin/AgentCommissionAdmin"));
const RewardsAdmin = lazy(() => import("./pages/admin/RewardsAdmin"));
const DatabaseAdmin = lazy(() => import("./pages/admin/DatabaseAdmin"));
const KycAdmin = lazy(() => import("./pages/admin/KycAdmin"));
const AdminAuditLogsPage = lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminCmsFoundationPage = lazy(() => import("./pages/admin/AdminCmsFoundationPage"));
const AdminCryptoTradingControlPage = lazy(() => import("./pages/admin/AdminCryptoTradingControlPage"));
const AdminApiGameControlsPage = lazy(() => import("./pages/admin/AdminApiGameControlsPage"));
const AdminAiBuilderPage = lazy(() => import("./pages/admin/AdminAiBuilderPage"));
const AdminUniversalCmsPage = lazy(() => import("./pages/admin/AdminUniversalCmsPage"));
const AdminAutomationCenterPage = lazy(() => import("./pages/admin/AdminAutomationCenterPage"));
const AdminDepositControlPage = lazy(() => import("./pages/admin/AdminDepositControlPage"));
const AdminDepositCentrePage = lazy(() => import("./pages/admin/AdminDepositCentrePage"));
const SuperAdminControlPage = lazy(() => import("./pages/admin/SuperAdminControlPage"));
const AdminAgentUsdtDepositPage = lazy(() => import("./pages/admin/AdminAgentUsdtDepositPage"));
const AdminFdUsdtControlPage = lazy(() => import("./pages/admin/AdminFdUsdtControlPage"));
const AdminPaymentGatewayManagerPage = lazy(() => import("./pages/admin/AdminPaymentGatewayManagerPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminRolesPage = lazy(() => import("./pages/admin/AdminRolesPage"));
const AdminDebugPage = lazy(() => import("./pages/admin/AdminDebugPage"));
const MarketPricesDebug = lazy(() => import("./pages/admin/MarketPricesDebug"));
const SuperAdminPage = lazy(() => import("./pages/admin/SuperAdminPage"));
const SecurityFixCenter = lazy(() => import("./pages/admin/SecurityFixCenter"));
const SecurityCenter = lazy(() => import("./pages/admin/SecurityCenter"));
const PromotionCenter = lazy(() => import("./pages/admin/PromotionCenter"));

const GoogleSearchConsoleSetup = lazy(() => import("./pages/admin/GoogleSearchConsoleSetup"));
const DualWalletOverview = lazy(() => import("./pages/admin/DualWalletOverview"));
const UsdtDepositsAdmin = lazy(() => import("./pages/admin/UsdtDepositsAdmin"));
const UsdtRateAdmin = lazy(() => import("./pages/admin/UsdtRateAdmin"));
const FdAdminDashboard = lazy(() => import("./pages/admin/FdAdminDashboard"));
const LuckyHubCentral = lazy(() => import("./pages/admin/LuckyHubCentral"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
const ReportsAnalytics = lazy(() => import("./pages/admin/ReportsAnalytics"));
const LuckyHub = lazy(() => import("./pages/LuckyHubCmsGate"));
const LuckyHubAdmin = lazy(() => import("./pages/admin/LuckyHubAdmin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const WinGo = lazy(() => import("./pages/games/WinGo"));
const K3 = lazy(() => import("./pages/games/K3"));
const FiveD = lazy(() => import("./pages/games/FiveD"));
const TrxWin = lazy(() => import("./pages/games/TrxWin"));
const MotoRace = lazy(() => import("./pages/games/MotoRace"));
const VideoWinGo = lazy(() => import("./pages/games/VideoWinGo"));
import { GameErrorBoundary } from "@/components/GameErrorBoundary";
import DbErrorTraceOverlay from "@/components/debug/DbErrorTraceOverlay";
const CrashGame = lazy(() => import("./pages/games/CrashGame"));
const Install = lazy(() => import("./pages/Install"));
const VerifyDeposit = lazy(() => import("./pages/VerifyDeposit"));
const GameStats = lazy(() => import("./pages/GameStats"));
const AIPredictionDashboard = lazy(() => import("./pages/AIPredictionDashboard"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const BadgeSettings = lazy(() => import("./pages/settings/BadgeSettings"));
const PersonalInformation = lazy(() => import("./pages/PersonalInformation"));
const GameHistory = lazy(() => import("./pages/GameHistory"));
const VIP = lazy(() => import("./pages/VIP"));
const Gifts = lazy(() => import("./pages/Gifts"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminNotificationPreferences = lazy(() => import("./pages/AdminNotificationPreferences"));
const CrashGameAdmin = lazy(() => import("./pages/admin/CrashGameAdmin"));
const GameLaunchNotifications = lazy(() => import("./pages/admin/GameLaunchNotifications"));
const MinesGame = lazy(() => import("./pages/games/MinesGame"));
const MinesGameAdmin = lazy(() => import("./pages/admin/MinesGameAdmin"));
const PayoutAuditLogs = lazy(() => import("./pages/admin/PayoutAuditLogs"));
const UserHistory = lazy(() => import("./pages/admin/UserHistory"));
const WinGoGameAdmin = lazy(() => import("./pages/admin/WinGoGameAdmin"));
const K3GameAdmin = lazy(() => import("./pages/admin/K3GameAdmin"));
const FiveDGameAdmin = lazy(() => import("./pages/admin/FiveDGameAdmin"));
const TrxWinGameAdmin = lazy(() => import("./pages/admin/TrxWinGameAdmin"));
const AviatorGame = lazy(() => import("./pages/games/AviatorGame"));
const TradingMarkets = lazy(() => import("./pages/TradingMarkets"));
const BinaryTrading = lazy(() => import("./pages/BinaryTrading"));
const Trading = lazy(() => import("./pages/Trading"));
const TradingAsset = lazy(() => import("./pages/TradingAsset"));
const TradingPro = lazy(() => import("./pages/TradingPro"));
const TokenDetail = lazy(() => import("./pages/TokenDetail"));
const AviatorGameAdmin = lazy(() => import("./pages/admin/AviatorGameAdmin"));
const ActivityAward = lazy(() => import("./pages/ActivityAward"));
const InvitationBonus = lazy(() => import("./pages/InvitationBonus"));
const BettingRebate = lazy(() => import("./pages/BettingRebate"));
const Deposit = lazy(() => import("./pages/DepositCentre"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const WithdrawAccounts = lazy(() => import("./pages/WithdrawAccounts"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Announcement = lazy(() => import("./pages/Announcement"));
const Support = lazy(() => import("./pages/Support"));
const Feedback = lazy(() => import("./pages/Feedback"));
const AgentApply = lazy(() => import("./pages/AgentApply"));
const AgentRegister = lazy(() => import("./pages/AgentRegister"));
const AgentPayment = lazy(() => import("./pages/AgentPayment"));
const AgentPaymentStatus = lazy(() => import("./pages/AgentPaymentStatus"));
const AgentPaymentsAdmin = lazy(() => import("./pages/admin/AgentPayments"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
import AgentGate from "./components/agent/AgentGate";
const GameAdminLogin = lazy(() => import("./pages/GameAdminLogin"));
const GameAdminDashboard = lazy(() => import("./pages/GameAdminDashboard"));
const GlobalSettings = lazy(() => import("./pages/game-admin/GlobalSettings"));
const GameAdminAuditLogs = lazy(() => import("./pages/game-admin/AuditLogs"));
const GameAdminStatistics = lazy(() => import("./pages/game-admin/Statistics"));
const UnifiedAdminDashboard = lazy(() => import("./pages/UnifiedAdminDashboard"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const UnifiedGameAdmin = lazy(() => import("./pages/admin/UnifiedGameAdmin"));
const AIChat = lazy(() => import("./pages/AIChat"));
const LuckySpinner = lazy(() => import("./pages/LuckySpinner"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Cashback = lazy(() => import("./pages/Cashback"));
const ProviderGames = lazy(() => import("./pages/ProviderGames"));
const ApiGameLaunch = lazy(() => import("./pages/ApiGameLaunch"));
const Lottery = lazy(() => import("./pages/Lottery"));
const Popular = lazy(() => import("./pages/Popular"));
const GamesLobby = lazy(() => import("./pages/GamesLobby"));
const GamesCatalog = lazy(() => import("./pages/GamesCatalog"));
const GamesPremium = lazy(() => import("./pages/GamesCmsGate"));
const SportsBetting = lazy(() => import("./pages/SportsBetting"));

const queryClient = new QueryClient();

const RouteFallback = () => <HomeSkeleton />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DemoModeBanner />
      <BrowserRouter>

        <PortraitLock />
        {import.meta.env.DEV && <DbErrorTraceOverlay />}
        {/* Debug Overlay - only shows in development */}
        {false && <ClickDebugOverlay />}
        {typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("debug") === "tap" && (
            <Suspense fallback={null}>
              <TapTargetDebug />
            </Suspense>
          )}
        <MobileContainer>
          <WalletProvider>
            <AuthGuard>
          <ScrollRestoration />
          <AdminUniversalNav />
          <ChunkErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Auth Routes (no bottom nav) */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/install" element={<Install />} />
            <Route path="/deposit" element={<Deposit />} />


            {import.meta.env.DEV && (
              <Route path="/__dev/lucky-hub-themes" element={<LuckyHubThemePreview />} />
            )}
            {import.meta.env.DEV && (
              <Route path="/__dev/tx-progress" element={<TxProgressHarness />} />
            )}
            <Route path="/__sentry-test" element={<SentryTest />} />
            <Route path="/__preview/home-mobile" element={<HomeMobilePreview />} />
            <Route path="/__preview/home-desktop" element={<HomeDesktopPreview />} />
            <Route path="/__preview/games" element={<GamesPremium />} />


            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/withdraw/accounts" element={<WithdrawAccounts />} />
            <Route path="/verify/deposit/:orderId" element={<VerifyDepositErrorBoundary><VerifyDeposit /></VerifyDepositErrorBoundary>} />
            
            {/* Main App Routes (with bottom nav via MainLayout) */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/promotion" element={<Promotion />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/wallet/workflow" element={<WalletWorkflow />} />
              <Route path="/wallet/third-party" element={<WalletThirdParty />} />
              <Route path="/wallet/transfer" element={<WalletAgentTransfer />} />
              <Route path="/wallet/analytics" element={<WalletAnalytics />} />
              <Route path="/wallet/history" element={<WalletTransactionHistory />} />
              <Route path="/wallet/security" element={<WalletSecurity />} />
              <Route path="/account" element={<Navigate to="/account/settings" replace />} />
              <Route path="/account/:tab" element={<Account />} />
              <Route path="/game-stats" element={<GameStats />} />
              <Route path="/ai-predictions" element={<AIPredictionDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/badges" element={<BadgeSettings />} />
              <Route path="/personal-information" element={<PersonalInformation />} />
              <Route path="/game-history" element={<GameHistory />} />
              <Route path="/vip" element={<VIP />} />
              <Route path="/gifts" element={<Gifts />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/activity-award" element={<ActivityAward />} />
              <Route path="/invitation-bonus" element={<InvitationBonus />} />
              <Route path="/betting-rebate" element={<BettingRebate />} />
              <Route path="/lucky-hub" element={<LuckyHub />} />
              <Route path="/fixed-deposits" element={<FixedDeposits />} />
              <Route path="/rewards" element={<RewardsCentre />} />
              <Route path="/rewards/checkin" element={<CheckIn />} />
              <Route path="/rewards/spin" element={<SpinWin />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/cashback" element={<Cashback />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/announcement" element={<Announcement />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/chat" element={<SupportChat />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/agent" element={<AgentGate>{() => <AgentDashboard />}</AgentGate>} />
              <Route path="/agent/apply" element={<AgentApply />} />
              <Route path="/agent/register" element={<AgentRegister />} />
              <Route path="/agent/dashboard" element={<AgentGate>{() => <AgentDashboard />}</AgentGate>} />
              <Route path="/agent/payment/:applicationId" element={<AgentPayment />} />
              <Route path="/agent/payment" element={<AgentPayment />} />
              <Route path="/agent/payment/status/:paymentId" element={<AgentPaymentStatus />} />
              <Route path="/lottery" element={<Lottery />} />
              <Route path="/popular" element={<GamesLobby />} />
              <Route path="/popular/legacy" element={<Popular />} />
              <Route path="/games" element={<GamesPremium />} />
              <Route path="/games/lobby" element={<GamesLobby />} />
              <Route path="/sports" element={<SportsBetting />} />
              <Route path="/sports-betting" element={<SportsBetting />} />
              <Route path="/wingo" element={<WinGo />} />
              <Route path="/k3" element={<K3 />} />
              {/* Game Routes */}
              <Route path="/game/win-go" element={<WinGo />} />
              {/* Alias used by some deep links / bottom-nav entries */}
              <Route path="/game/wingo" element={<WinGo />} />
              <Route path="/game/k3" element={<K3 />} />
              <Route path="/game/5d" element={<FiveD />} />
              <Route path="/game/trx-win" element={<TrxWin />} />
              <Route path="/game/motorace" element={<GameErrorBoundary game="MotoRace"><MotoRace /></GameErrorBoundary>} />
              <Route path="/game/video-wingo" element={<GameErrorBoundary game="VideoWinGo"><VideoWinGo /></GameErrorBoundary>} />
              {/* Engine routes redirect to canonical game pages */}
              <Route path="/engine/wingo" element={<Navigate to="/game/win-go" replace />} />
              <Route path="/engine/k3" element={<Navigate to="/game/k3" replace />} />
              <Route path="/engine/trx" element={<Navigate to="/game/trx-win" replace />} />
              <Route path="/engine/5d" element={<Navigate to="/game/5d" replace />} />
              <Route path="/game/crash" element={<CrashGame />} />
              <Route path="/game/mines" element={<MinesGame />} />
              <Route path="/game/aviator" element={<AviatorGame />} />
              <Route path="/game/lucky-spinner" element={<LuckySpinner />} />
              {/* API Game Routes */}
              {/* Trading routes (must come before /games/:providerId) */}
              <Route path="/trading" element={<Trading />} />
              <Route path="/trading-pro" element={<TradingPro />} />
              <Route path="/trading/:asset" element={<TradingAsset />} />
              <Route path="/games/trading" element={<TradingMarkets />} />
              {/* Redirect old binary route to new premium trading module */}
              <Route path="/games/trading/:asset" element={<RedirectToTrading />} />
              <Route path="/markets/:asset" element={<TokenDetail />} />
              <Route path="/games/catalog" element={<GamesCatalog />} />
              <Route path="/games/:providerId" element={<ProviderGames />} />
              <Route path="/game/api/:providerId/:gameCode" element={<ApiGameLaunch />} />
            </Route>
            
            {/* Admin Debug Route - DEV builds only. In production this is a NotFound. */}
            <Route
              path="/admin/debug"
              element={import.meta.env.DEV ? <AdminDebugPage /> : <NotFound />}
            />
            
            {/* Admin Routes - All wrapped in AdminLayout with Auth Guard */}
            <Route path="/admin" element={<AdminLayout />}>
              {/* Login page (public, handled by AdminLayout) */}
              <Route path="login" element={<AdminLoginPage />} />
              
              {/* Protected admin routes - Premium UI */}
              <Route index element={<PremiumAdminDashboard />} />
              <Route path="dashboard" element={<PremiumAdminDashboard />} />
              <Route path="overview" element={<DashboardOverview />} />
              <Route path="internal-assets" element={<InternalAssetPrices />} />
              <Route path="market-prices-debug" element={<MarketPricesDebug />} />
              <Route path="users" element={<NewUsersPage />} />
              <Route path="agents" element={<AdminAgentsPage />} />
              <Route path="deposits" element={<PremiumDepositsPage />} />
              <Route path="deposits/:status" element={<PremiumDepositsPage />} />
              <Route path="withdraws" element={<PremiumWithdrawsPage />} />
              <Route path="withdraws/:status" element={<PremiumWithdrawsPage />} />
              <Route path="withdrawal-accounts" element={<WithdrawalAccountsAdmin />} />
              <Route path="transactions" element={<NewTransactionsPage />} />
              <Route path="wallet-ledger" element={<NewTransactionsPage />} />
              <Route path="dual-wallet" element={<DualWalletOverview />} />
              <Route path="usdt-deposits" element={<UsdtDepositsAdmin />} />
              <Route path="usdt-rate" element={<UsdtRateAdmin />} />
              <Route path="fd-dashboard" element={<FdAdminDashboard />} />
              <Route path="lucky-hub-central" element={<LuckyHubCentral />} />
              <Route path="payment-management" element={<PaymentManagement />} />
              <Route path="system-logs" element={<SystemLogs />} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="reports-analytics" element={<ReportsAnalytics />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="admin-users" element={<SuperAdminPage />} />
              <Route path="super-admin" element={<SuperAdminPage />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="cms" element={<AdminCmsFoundationPage />} />
              <Route path="crypto-trading-control" element={<AdminCryptoTradingControlPage />} />
              <Route path="api-game-controls" element={<AdminApiGameControlsPage />} />
              <Route path="ai-builder" element={<AdminAiBuilderPage />} />
              <Route path="cms-manager" element={<AdminUniversalCmsPage />} />
              <Route path="automation-center" element={<AdminAutomationCenterPage />} />
              <Route path="deposit-centre" element={<AdminDepositCentrePage />} />
              <Route path="super-admin-control" element={<SuperAdminControlPage />} />
              <Route path="deposit-control" element={<AdminDepositControlPage />} />
              <Route path="agent-usdt-deposit" element={<AdminAgentUsdtDepositPage />} />
              <Route path="fd-usdt-control" element={<AdminFdUsdtControlPage />} />
              <Route path="payment-gateways" element={<AdminPaymentGatewayManagerPage />} />
              <Route path="security" element={<SecurityCenter />} />
              <Route path="promotions" element={<PromotionCenter />} />
              <Route path="promotion-management" element={<PromotionCenter />} />

              
              {/* Legacy routes */}
              <Route path="unified" element={<UnifiedAdminDashboard />} />
              <Route path="notifications" element={<AdminNotificationPreferences />} />
              <Route path="crash-game" element={<CrashGameAdmin />} />
              <Route path="game-launch-notifications" element={<GameLaunchNotifications />} />
              <Route path="mines-game" element={<MinesGameAdmin />} />
              <Route path="wingo-game" element={<WinGoGameAdmin />} />
              <Route path="k3-game" element={<K3GameAdmin />} />
              <Route path="5d-game" element={<FiveDGameAdmin />} />
              <Route path="trxwin-game" element={<TrxWinGameAdmin />} />
              <Route path="aviator-game" element={<AviatorGameAdmin />} />
              <Route path="payout-audit" element={<PayoutAuditLogs />} />
              <Route path="user-history" element={<UserHistory />} />
              
              {/* Unified Game Admin Routes */}
              <Route path="game/control" element={<UnifiedAdminDashboard />} />
              <Route path="game/:gameType" element={<UnifiedGameAdmin />} />
              
              {/* Game Control Routes - using /games/ path */}
              <Route path="games/wingo" element={<WinGoGameAdmin />} />
              <Route path="games/k3" element={<K3GameAdmin />} />
              <Route path="games/5d" element={<FiveDGameAdmin />} />
              <Route path="games/trxwin" element={<TrxWinGameAdmin />} />
              <Route path="games/crash" element={<CrashGameAdmin />} />
              <Route path="games/aviator" element={<AviatorGameAdmin />} />
              <Route path="games/mines" element={<MinesGameAdmin />} />
              
              {/* Finance Routes */}
              <Route path="finance/overview" element={<PremiumAdminDashboard />} />
              <Route path="finance/detail" element={<FinancialDashboard />} />
              <Route path="financial" element={<FinancialDashboard />} />
              <Route path="finance/revenue" element={<PremiumAdminDashboard />} />
              <Route path="finance/payouts" element={<PayoutAuditLogs />} />

              
              {/* Promotions Routes */}
              <Route path="promotions/bonuses" element={<AdminSettingsPage />} />
              <Route path="promotions/vip" element={<AdminSettingsPage />} />
              <Route path="promotions/cashback" element={<AdminSettingsPage />} />
              
              {/* Other Routes */}
              <Route path="banners" element={<BannersAdmin />} />
              <Route path="announcements" element={<AnnouncementsAdmin />} />
              <Route path="support" element={<SupportChatAdmin />} />
              <Route path="support-chat" element={<SupportChatAdmin />} />
              <Route path="agent-commission" element={<AgentCommissionAdmin />} />
              <Route path="rewards" element={<RewardsAdmin />} />
              <Route path="rewards-management" element={<RewardsAdmin />} />
              <Route path="database" element={<DatabaseAdmin />} />
              <Route path="database-tools" element={<DatabaseAdmin />} />
              <Route path="kyc" element={<KycAdmin />} />
              <Route path="kyc-review" element={<KycAdmin />} />
              <Route path="blocked-ips" element={<SuperAdminPage />} />
              <Route path="security-fix-center" element={<SecurityFixCenter />} />
              <Route path="agent-payments" element={<AgentPaymentsAdmin />} />
              <Route path="seo/google-search-console" element={<GoogleSearchConsoleSetup />} />
              <Route path="lucky-hub" element={<LuckyHubAdmin />} />
            </Route>

            {/* Game Admin Routes (separate panel) */}
            <Route path="/game-admin/login" element={<GameAdminLogin />} />
            <Route
              path="/game-admin"
              element={
                <GameAdminGuard>
                  <GameAdminDashboard />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/wingo"
              element={
                <GameAdminGuard>
                  <WinGoGameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/k3"
              element={
                <GameAdminGuard>
                  <K3GameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/5d"
              element={
                <GameAdminGuard>
                  <FiveDGameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/crash"
              element={
                <GameAdminGuard>
                  <CrashGameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/mines"
              element={
                <GameAdminGuard>
                  <MinesGameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/aviator"
              element={
                <GameAdminGuard>
                  <AviatorGameAdmin />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/crypto-trading"
              element={
                <GameAdminGuard>
                  <AdminCryptoTradingControlPage />
                </GameAdminGuard>
              }
            />

            <Route
              path="/game-admin/settings"
              element={
                <GameAdminGuard>
                  <GlobalSettings />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/audit"
              element={
                <GameAdminGuard>
                  <GameAdminAuditLogs />
                </GameAdminGuard>
              }
            />
            <Route
              path="/game-admin/stats"
              element={
                <GameAdminGuard>
                  <GameAdminStatistics />
                </GameAdminGuard>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ChunkErrorBoundary>
            </AuthGuard>
          </WalletProvider>
        </MobileContainer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
