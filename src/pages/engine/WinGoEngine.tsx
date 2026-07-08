import React from "react";
import GameShell from "@/components/engine/GameShell";
import { WinGoModule } from "@/engine";

const choices = () => [
  { type: "color", value: "green", label: "Green", odds: 2, color: "linear-gradient(135deg,#22c55e,#16a34a)" },
  { type: "color", value: "violet", label: "Violet", odds: 4.5, color: "linear-gradient(135deg,#a855f7,#7c3aed)" },
  { type: "color", value: "red", label: "Red", odds: 2, color: "linear-gradient(135deg,#ef4444,#dc2626)" },
  { type: "bigSmall", value: "Big", label: "Big (5-9)", odds: 2, color: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { type: "bigSmall", value: "Small", label: "Small (0-4)", odds: 2, color: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { type: "oddEven", value: "Odd", label: "Odd", odds: 2, color: "linear-gradient(135deg,#06b6d4,#0891b2)" },
];

const rules = [
  "Pick a color, big/small, or odd/even before the timer locks (last 5s).",
  "Green / Red pay 2x. Violet pays 4.5x. Numbers 0 and 5 are dual-color.",
  "Big = 5-9, Small = 0-4. Odd / Even based on result digit.",
  "Multiplier multiplies your stake; total potential win = stake × odds.",
];

const WinGoEngine: React.FC = () => <GameShell mod={WinGoModule} defaultChoices={choices} rules={rules} />;
export default WinGoEngine;
