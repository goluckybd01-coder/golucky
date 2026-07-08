import React from "react";
import GameShell from "@/components/engine/GameShell";
import { FiveDModule } from "@/engine";

const choices = () => [
  { type: "sumBigSmall", value: "Big", label: "Sum Big (23-45)", odds: 2, color: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { type: "sumBigSmall", value: "Small", label: "Sum Small (0-22)", odds: 2, color: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { type: "sumOddEven", value: "Odd", label: "Sum Odd", odds: 2, color: "linear-gradient(135deg,#06b6d4,#0891b2)" },
  { type: "sumOddEven", value: "Even", label: "Sum Even", odds: 2, color: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { type: "position", value: "A", label: "Position A", odds: 9, color: "linear-gradient(135deg,#22c55e,#15803d)" },
  { type: "position", value: "E", label: "Position E", odds: 9, color: "linear-gradient(135deg,#ef4444,#b91c1c)" },
];

const rules = [
  "Five digits A-B-C-D-E are drawn each round (0-9 each).",
  "Sum = A+B+C+D+E. Big = 23-45, Small = 0-22.",
  "Position bets pay 9x for an exact digit match.",
];

const FiveDEngine: React.FC = () => <GameShell mod={FiveDModule} defaultChoices={choices} rules={rules} />;
export default FiveDEngine;
