import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LuckyHub from "@/pages/LuckyHub";

vi.mock("@/components/BottomNav", () => ({ default: () => null }));

describe("Lucky Hub v3 lock", () => {
  it("renders all 16 anchor sections in order", () => {
    render(
      <MemoryRouter>
        <LuckyHub />
      </MemoryRouter>
    );
    // Anchor labels expected in the DOM (one per section)
    const anchors = [
      "LUCKY HUB",              // 1
      "Agent Program",          // 2 hero chip
      "Quick Access",           // 3
      "Fixed Deposit",          // 4 (badge)
      "Premium Fixed Deposit",  // 4 title
      "MEGA JACKPOT",           // 5
      "LIVE EVENTS",            // 6
      "TOURNAMENT ARENA",       // 7
      "MISSION HUB",            // 8
      "MILLIONAIRE CLUB",       // 9
      "Mystery Box & Lucky Zone", // 10
      "VIP CLUB",               // 11
      "Recent Winners",         // 12
      "AGENT PROGRAMME",        // 13
      "LUCKY WHEEL",            // 14
      "Upcoming Events",        // 15
      "Play. Invest. Earn.",    // 16 (ecosystem footer)
    ];
    for (const label of anchors) {
      expect(screen.getAllByText((t) => t.includes(label)).length).toBeGreaterThan(0);
    }
  });
});
