import React from "react";
import GameShell from "@/components/engine/GameShell";
import { K3Module } from "@/engine";

const choices = () => [
  { type: "bigSmall", value: "Big", label: "Big (11-17)", odds: 1.98, color: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { type: "bigSmall", value: "Small", label: "Small (4-10)", odds: 1.98, color: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { type: "oddEven", value: "Odd", label: "Odd", odds: 1.98, color: "linear-gradient(135deg,#06b6d4,#0891b2)" },
  { type: "oddEven", value: "Even", label: "Even", odds: 1.98, color: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { type: "triple", value: "any", label: "Any Triple", odds: 34.56, color: "linear-gradient(135deg,#ef4444,#b91c1c)" },
  { type: "sum", value: "10", label: "Sum 10/11", odds: 6.85, color: "linear-gradient(135deg,#22c55e,#15803d)" },
];

const rules = [
  "Three dice are rolled each round (4-17 sum).",
  "Big = sum 11-17, Small = sum 4-10. Triples are excluded.",
  "Any Triple pays 34.56x. Specific sums pay variable odds.",
];

const K3Engine: React.FC = () => <GameShell mod={K3Module} defaultChoices={choices} rules={rules} />;
export default K3Engine;
