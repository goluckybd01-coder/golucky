import { ReactElement, ReactNode } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import {
  WalletContext,
  type WalletContextValue,
  CURRENCY,
  CURRENCY_SYMBOL,
} from "@/context/WalletContext";
import { formatTaka } from "@/lib/currency";

export const defaultMockWallet: WalletContextValue = {
  balance: 0,
  available_balance: 0,
  locked_balance: 0,
  total_deposit: 0,
  total_withdraw: 0,
  total_bet: 0,
  total_win: 0,
  currency: CURRENCY,
  currencySymbol: CURRENCY_SYMBOL,
  updatedAt: null,
  isLoading: false,
  isAuthenticated: false,
  formattedBalance: formatTaka(0),
  refresh: async () => {},
  loadBalance: async () => {},
  placeBet: async () => false,
  claimWinnings: async () => false,
  canAfford: () => false,
};

export interface ProviderOptions {
  routerEntries?: MemoryRouterProps["initialEntries"];
  withRouter?: boolean;
  /** Override wallet context value; falsy = use defaults, null = omit provider. */
  wallet?: Partial<WalletContextValue> | null;
}

interface AllProvidersProps extends ProviderOptions {
  children: ReactNode;
}

export function AllProviders({
  children,
  routerEntries,
  withRouter = true,
  wallet,
}: AllProvidersProps) {
  let tree: ReactNode = children;

  if (wallet !== null) {
    const value: WalletContextValue = { ...defaultMockWallet, ...(wallet ?? {}) };
    tree = <WalletContext.Provider value={value}>{tree}</WalletContext.Provider>;
  }

  tree = <HelmetProvider>{tree}</HelmetProvider>;

  if (withRouter) {
    tree = <MemoryRouter initialEntries={routerEntries}>{tree}</MemoryRouter>;
  }
  return <>{tree}</>;
}

/**
 * Shared test render helper. Wraps the UI in HelmetProvider + WalletProvider
 * (mocked) + MemoryRouter by default. Extend here when new global providers
 * are added (Query, Theme, etc.).
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    routerEntries,
    withRouter,
    wallet,
    ...options
  }: ProviderOptions & Omit<RenderOptions, "wrapper"> = {},
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerEntries={routerEntries} withRouter={withRouter} wallet={wallet}>
        {children}
      </AllProviders>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
