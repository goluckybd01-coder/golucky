import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";

/**
 * Guardrail: every primary wallet CTA (Deposit / Withdraw / Transfer) must
 * appear exactly once on each homepage layout. Prevents future regressions
 * where duplicate buttons creep back into hero, header, or footer sections.
 */

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => {
      const ch: any = {};
      ch.on = () => ch;
      ch.subscribe = () => ch;
      return ch;
    }),
    removeChannel: vi.fn(),
  },
}));

// Third-party components pulled in by HomeMobile that aren't relevant here.
vi.mock("@/components/InstallPromptBanner", () => ({ default: () => null }));
vi.mock("@/components/status/CiStatusBadge", () => ({ CiStatusBadge: () => null }));
vi.mock("@/components/dev/TapTargetDebug", () => ({ default: () => null }));
vi.mock("@/hooks/useUiSound", () => ({
  useUiSound: () => ({ hover: () => {}, tap: () => {} }),
}));

import HomeMobile from "@/pages/HomeMobile";
import HomeDesktop from "@/pages/HomeDesktop";

const CTAS = ["Deposit", "Withdraw", "Transfer"] as const;

function countCTAs(root: HTMLElement) {
  const buttons = Array.from(root.querySelectorAll("button, a"));
  const counts: Record<string, number> = { Deposit: 0, Withdraw: 0, Transfer: 0 };
  for (const el of buttons) {
    // Normalize: collapse whitespace, strip trailing arrow/emoji punctuation.
    const text = (el.textContent || "").replace(/\s+/g, " ").trim().replace(/[→\s]+$/, "");
    for (const cta of CTAS) {
      // Exact-label match only — ignores promo copy like "First Deposit 100%"
      // or footer nav links like "Fixed Deposit".
      if (text === cta) counts[cta]++;
    }
  }
  return counts;
}


describe.each([
  { name: "HomeMobile", Component: HomeMobile },
  { name: "HomeDesktop", Component: HomeDesktop },
])("$name — unified wallet CTAs", ({ Component }) => {
  it("renders Deposit, Withdraw, and Transfer exactly once each", () => {
    const { container } = renderWithProviders(<Component />);
    const counts = countCTAs(container as HTMLElement);
    expect(counts).toEqual({ Deposit: 1, Withdraw: 1, Transfer: 1 });
  });
});
