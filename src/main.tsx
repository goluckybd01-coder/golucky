import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
if (typeof window !== "undefined") {
  setTimeout(() => {
    import("@fontsource/cinzel-decorative/700.css").catch(() => {});
  }, 2000);
}
import "@fontsource/plus-jakarta-sans/300.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import { installGlobalErrorHandlers } from "./lib/globalErrorHandlers";
import { initSentry } from "./lib/sentry";
import { verifySuperAdminIntegrity } from "./lib/superAdminCheck";

initSentry();
installGlobalErrorHandlers();
verifySuperAdminIntegrity();

const LEGACY_WALLET_KEYS = [
  "golucky_wallet_balance",
  "golucky_wallet_history",
];

LEGACY_WALLET_KEYS.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`[Wallet Cleanup] Removed legacy key: ${key}`);
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
