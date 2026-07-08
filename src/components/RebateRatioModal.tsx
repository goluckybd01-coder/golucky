import { ChevronLeft, Gamepad2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface RebateRatioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RebateLevel {
  level: string;
  tiers: { tier: number; rate: string }[];
}

const lotteryRebateData: RebateLevel[] = [
  {
    level: "L0",
    tiers: [
      { tier: 1, rate: "0.6%" },
      { tier: 2, rate: "0.18%" },
      { tier: 3, rate: "0.054%" },
      { tier: 4, rate: "0.0162%" },
      { tier: 5, rate: "0.00486%" },
      { tier: 6, rate: "0.001458%" },
    ],
  },
  {
    level: "L1",
    tiers: [
      { tier: 1, rate: "0.7%" },
      { tier: 2, rate: "0.245%" },
      { tier: 3, rate: "0.08575%" },
      { tier: 4, rate: "0.030012%" },
      { tier: 5, rate: "0.010504%" },
      { tier: 6, rate: "0.003677%" },
    ],
  },
  {
    level: "L2",
    tiers: [
      { tier: 1, rate: "0.75%" },
      { tier: 2, rate: "0.28125%" },
      { tier: 3, rate: "0.105469%" },
      { tier: 4, rate: "0.039551%" },
      { tier: 5, rate: "0.014832%" },
      { tier: 6, rate: "0.005562%" },
    ],
  },
  {
    level: "L3",
    tiers: [
      { tier: 1, rate: "0.8%" },
      { tier: 2, rate: "0.32%" },
      { tier: 3, rate: "0.128%" },
      { tier: 4, rate: "0.0512%" },
      { tier: 5, rate: "0.02048%" },
      { tier: 6, rate: "0.008192%" },
    ],
  },
  {
    level: "L4",
    tiers: [
      { tier: 1, rate: "0.85%" },
      { tier: 2, rate: "0.36125%" },
      { tier: 3, rate: "0.153531%" },
      { tier: 4, rate: "0.065251%" },
      { tier: 5, rate: "0.027732%" },
      { tier: 6, rate: "0.011786%" },
    ],
  },
  {
    level: "L5",
    tiers: [
      { tier: 1, rate: "0.9%" },
      { tier: 2, rate: "0.405%" },
      { tier: 3, rate: "0.18225%" },
      { tier: 4, rate: "0.082012%" },
      { tier: 5, rate: "0.036906%" },
      { tier: 6, rate: "0.016608%" },
    ],
  },
  {
    level: "L6",
    tiers: [
      { tier: 1, rate: "1%" },
      { tier: 2, rate: "0.5%" },
      { tier: 3, rate: "0.25%" },
      { tier: 4, rate: "0.125%" },
      { tier: 5, rate: "0.0625%" },
      { tier: 6, rate: "0.03125%" },
    ],
  },
  {
    level: "L7",
    tiers: [
      { tier: 1, rate: "1.1%" },
      { tier: 2, rate: "0.605%" },
      { tier: 3, rate: "0.33275%" },
      { tier: 4, rate: "0.183013%" },
      { tier: 5, rate: "0.100657%" },
      { tier: 6, rate: "0.055361%" },
    ],
  },
  {
    level: "L8",
    tiers: [
      { tier: 1, rate: "1.2%" },
      { tier: 2, rate: "0.72%" },
      { tier: 3, rate: "0.432%" },
      { tier: 4, rate: "0.2592%" },
      { tier: 5, rate: "0.15552%" },
      { tier: 6, rate: "0.093312%" },
    ],
  },
  {
    level: "L9",
    tiers: [
      { tier: 1, rate: "1.3%" },
      { tier: 2, rate: "0.845%" },
      { tier: 3, rate: "0.54925%" },
      { tier: 4, rate: "0.357013%" },
      { tier: 5, rate: "0.232058%" },
      { tier: 6, rate: "0.150838%" },
    ],
  },
  {
    level: "L10",
    tiers: [
      { tier: 1, rate: "1.4%" },
      { tier: 2, rate: "0.98%" },
      { tier: 3, rate: "0.686%" },
      { tier: 4, rate: "0.4802%" },
      { tier: 5, rate: "0.33614%" },
      { tier: 6, rate: "0.235298%" },
    ],
  },
];

const RebateRatioModal = ({ open, onOpenChange }: RebateRatioModalProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => onOpenChange(false)} className="p-1">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <SheetTitle className="text-lg font-bold text-gray-800">Lottery Rebate Ratio</SheetTitle>
            <div className="w-8" />
          </div>

          {/* Lottery Header Badge */}
          <div className="flex justify-center pb-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl shadow-lg">
              <Gamepad2 size={18} />
              <span className="text-sm font-medium">Lottery</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(90vh-130px)] p-4 space-y-4">
          {lotteryRebateData.map((level) => (
            <div key={level.level} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-gray-800 font-medium">
                  Rebate level <span className="text-teal-600 font-bold italic">{level.level}</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {level.tiers.map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        tier.tier === 1 ? "bg-orange-500" :
                        tier.tier === 2 ? "bg-orange-400" :
                        tier.tier === 3 ? "bg-orange-300" :
                        "bg-gray-300"
                      }`} />
                      <span className="text-gray-600 text-sm">
                        {tier.tier} level lower level commission rebate
                      </span>
                    </div>
                    <span className="text-gray-800 font-medium text-sm">{tier.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RebateRatioModal;
