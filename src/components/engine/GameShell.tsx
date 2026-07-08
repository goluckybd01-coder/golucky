import React from "react";
import { useSearchParams } from "react-router-dom";
import type { GameModule, Market } from "@/engine";
import { MARKETS, marketLabel, useGameEngine } from "@/engine";
import PremiumHeader from "./PremiumHeader";
import MarketTabs from "./MarketTabs";
import CurrentRoundCard from "./CurrentRoundCard";
import StatisticsPanel from "./StatisticsPanel";
import RecentResultsStrip from "./RecentResultsStrip";
import HistoryTable from "./HistoryTable";
import RulesSheet from "./RulesSheet";
import BetPanelHost from "./BetPanelHost";

interface Choice { type: string; value: string; label: string; odds: number; color: string }

interface Props {
  mod: GameModule;
  defaultChoices: (market: Market) => Choice[];
  rules: string[];
}

const GameShell: React.FC<Props> = ({ mod, defaultChoices, rules }) => {
  const [params, setParams] = useSearchParams();
  const rawMarket = parseInt(params.get("market") || "60", 10) as Market;
  const market: Market = (MARKETS as number[]).includes(rawMarket) ? rawMarket : 60;
  const setMarket = (m: Market) => setParams({ market: String(m) }, { replace: true });

  const { round, countdown, history, stats, placeBet } = useGameEngine(mod, market);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <PremiumHeader title={mod.name} subtitle={`Engine v1 • ${marketLabel(market)}`} />
      <MarketTabs market={market} onChange={setMarket} />
      <CurrentRoundCard round={round} countdown={countdown} marketLabel={marketLabel(market)} />
      <StatisticsPanel stats={stats} />
      <RecentResultsStrip results={history} />
      <BetPanelHost mod={mod} market={market} round={round} countdown={countdown}
        choices={defaultChoices(market)} placeBet={placeBet} />
      <HistoryTable results={history} />
      <RulesSheet rules={rules} />
    </div>
  );
};
export default GameShell;
