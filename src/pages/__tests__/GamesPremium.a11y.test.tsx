import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/components/BottomNav", () => ({ default: () => <nav data-testid="bottom-nav" /> }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: () => ({ on: function () { return this; }, subscribe: () => ({}) }),
    removeChannel: () => {},
  },
}));

import GamesPremium, { POPULAR } from "@/pages/GamesPremium";

const CATEGORY_LABELS = [
  "WinGo", "Lottery", "Trading", "Aviator", "Crash",
  "Slots", "Fishing", "Sports", "Casino",
];
const COLLECTION_LABELS = ["Crown", "Diamond", "Elite", "VIP", "Legend", "Mega"];

describe("GamesPremium card a11y — accessible names & focus", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true, configurable: true, value: 1280,
    });
  });

  it("every category card exposes an accessible name", () => {
    renderWithProviders(<GamesPremium />);
    for (const name of CATEGORY_LABELS) {
      const btn = screen.getByRole("button", {
        name: new RegExp(`^Browse ${name}\\b`, "i"),
      });
      expect(btn).toHaveAccessibleName();
      expect(btn.className).toMatch(/focus-visible:ring-2/);
    }
  });

  it("every popular game card exposes 'Play <name> by <provider>'", () => {
    renderWithProviders(<GamesPremium />);
    for (const g of POPULAR) {
      const btn = screen.getByRole("button", {
        name: new RegExp(`^Play ${g.name} by ${g.provider}$`, "i"),
      });
      expect(btn).toHaveAccessibleName();
      expect(btn.className).toMatch(/focus-visible:ring-2/);
    }
  });

  it("every collection card exposes 'Open <name> Collection'", () => {
    renderWithProviders(<GamesPremium />);
    for (const name of COLLECTION_LABELS) {
      const btn = screen.getByRole("button", {
        name: new RegExp(`^Open ${name} Collection\\b`, "i"),
      });
      expect(btn).toHaveAccessibleName();
      expect(btn.className).toMatch(/focus-visible:ring-2/);
    }
  });

  it("card buttons receive DOM focus when tabbed to", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GamesPremium />);

    const btn = screen.getByRole("button", {
      name: /^Play Aviator by Spribe$/i,
    });
    btn.focus();
    expect(document.activeElement).toBe(btn);

    // Tab moves focus to the next focusable element (still a real element).
    await user.tab();
    expect(document.activeElement).not.toBe(btn);
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
    expect((document.activeElement as HTMLElement).tagName).not.toBe("BODY");
  });
});
