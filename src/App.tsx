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
import NotFound from "./pages/NotFound";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Home = lazy(() => import("./pages/HomeCmsGate"));
import VerifyDepositErrorBoundary from "./components/VerifyDepositErrorBoundary";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";

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
        <MobileContainer>
          <WalletProvider>
            <AuthGuard>
              <ScrollRestoration />
              <ChunkErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/home" element={<MainLayout />}>
                      <Route index element={<Home />} />
                    </Route>
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
