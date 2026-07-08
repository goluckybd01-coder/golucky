import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import axe from "axe-core";

vi.mock("@/components/BottomNav", () => ({ default: () => <nav data-testid="bottom-nav" /> }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: () => ({ on: function () { return this; }, subscribe: () => ({}) }),
    removeChannel: () => {},
  },
}));

import GamesPremium from "@/pages/GamesPremium";

describe("GamesPremium — axe-core accessibility audit", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true, configurable: true, value: 1280,
    });
  });

  it("has no serious or critical axe violations on the cards page", async () => {
    const { container } = renderWithProviders(<GamesPremium />);

    const results = await axe.run(container, {
      // jsdom can't compute layout/color; skip rules that require a real browser.
      rules: {
        "color-contrast": { enabled: false },
        "target-size": { enabled: false },
        region: { enabled: false },
      },
      resultTypes: ["violations"],
    });

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (blocking.length) {
      // Surface useful debug output when the assertion fails.
      // eslint-disable-next-line no-console
      console.error(
        "axe violations:\n" +
          blocking
            .map(
              (v) =>
                `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})\n    ${v.helpUrl}`,
            )
            .join("\n"),
      );
    }

    expect(blocking).toEqual([]);
  }, 20000);
});
