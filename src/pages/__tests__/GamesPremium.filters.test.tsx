import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/components/BottomNav", () => ({ default: () => <nav data-testid="bottom-nav" /> }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: () => ({
      on: function () { return this; },
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
  },
}));

import GamesPremium from "@/pages/GamesPremium";

function popularPanel() {
  return screen.getByRole("heading", { name: /most popular games/i }).closest("section")!;
}

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event("resize"));
}

describe.each([
  { label: "mobile", width: 390 },
  { label: "desktop", width: 1280 },
])("GamesPremium search & category filters ($label)", ({ width }) => {
  beforeEach(() => setViewport(width));

  it("filters the popular grid by search query and clears via the Clear pill", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GamesPremium />);

    const panel = popularPanel();
    expect(within(panel).getByText("Aviator")).toBeInTheDocument();
    expect(within(panel).getByText("WinGo")).toBeInTheDocument();

    const search = screen.getByPlaceholderText(/search games/i);
    await user.type(search, "avia");

    expect(within(popularPanel()).getByText("Aviator")).toBeInTheDocument();
    expect(within(popularPanel()).queryByText("WinGo")).not.toBeInTheDocument();
    expect(within(popularPanel()).queryByText("Sweet Bonanza")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear search and filters/i }));

    expect((search as HTMLInputElement).value).toBe("");
    expect(within(popularPanel()).getByText("WinGo")).toBeInTheDocument();
    expect(within(popularPanel()).getByText("Sweet Bonanza")).toBeInTheDocument();
  });

  it("filters the popular grid by category chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GamesPremium />);

    await user.click(screen.getByRole("button", { name: /^slots$/i }));

    const panel = popularPanel();
    expect(within(panel).getByText("Sweet Bonanza")).toBeInTheDocument();
    expect(within(panel).getByText("Gates of Olympus")).toBeInTheDocument();
    expect(within(panel).queryByText("Aviator")).not.toBeInTheDocument();
    expect(within(panel).queryByText("WinGo")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear search and filters/i }));
    expect(within(popularPanel()).getByText("Aviator")).toBeInTheDocument();
  });

  it("combines search query with a category filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GamesPremium />);

    await user.click(screen.getByRole("button", { name: /^casino$/i }));
    await user.type(screen.getByPlaceholderText(/search games/i), "roulette");

    const panel = popularPanel();
    expect(within(panel).getByText("Roulette")).toBeInTheDocument();
    expect(within(panel).queryByText("Blackjack")).not.toBeInTheDocument();
  });
});
