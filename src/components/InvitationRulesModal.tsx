import { X, Crown } from "lucide-react";

interface InvitationRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRebateRatio?: () => void;
}

const InvitationRulesModal = ({ isOpen, onClose, onViewRebateRatio }: InvitationRulesModalProps) => {
  if (!isOpen) return null;

  const rules = [
    {
      number: "01",
      content: "There are 6 subordinate levels in inviting friends. If A invites B, then B is a level 1 subordinate of A. If B invites C, then C is a level 1 subordinate of B and also a level 2 subordinate of A. If C invites D, then D is a level 1 subordinate of C, at the same time a level 2 subordinate of B and also a level 3 subordinate of A."
    },
    {
      number: "02",
      content: "When inviting friends to register, you must send the invitation link provided or enter the invitation code manually so that your friends become your level 1 subordinates."
    },
    {
      number: "03",
      content: "The invitee registers via the inviter's invitation code and completes the deposit, shortly after that the commission will be received immediately."
    },
    {
      number: "04",
      content: "The calculation of yesterday's commission starts every morning at 01:00. After the commission calculation is completed, the commission is rewarded to the wallet and can be viewed through the commission collection record."
    },
    {
      number: "05",
      content: "Commission rates vary depending on your agency level on that day.\n• Number of Teams: How many downline deposits you have to date.\n• Team Deposits: The total number of deposits made by your downline in one day.\n• Team Deposit: Your downline deposits within one day."
    },
    {
      number: "06",
      content: "The commission percentage depends on the membership level. The higher the membership level, the higher the bonus percentage. Different game types also have different payout percentages."
    },
    {
      number: "07",
      content: "TOP20 commission rankings will be randomly awarded with a separate bonus."
    },
    {
      number: "08",
      content: "The final interpretation of this activity belongs to GoLucky."
    }
  ];

  const levelTiers = [
    { level: "L0", icon: "🎖️", teamNumber: 0, teamBetting: "0", teamDeposit: "0" },
    { level: "L1", icon: "🥉", teamNumber: 5, teamBetting: "500K", teamDeposit: "100K" },
    { level: "L2", icon: "🥈", teamNumber: 10, teamBetting: "1,000K", teamDeposit: "200K" },
    { level: "L3", icon: "🥇", teamNumber: 15, teamBetting: "2.50M", teamDeposit: "500K" },
    { level: "L4", icon: "👑", teamNumber: 20, teamBetting: "3.50M", teamDeposit: "700K" },
    { level: "L5", icon: "💎", teamNumber: 25, teamBetting: "5M", teamDeposit: "1,000K" },
    { level: "L6", icon: "🏆", teamNumber: 30, teamBetting: "10M", teamDeposit: "2M" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-rose-50 to-white rounded-t-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative py-4 px-4 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1"
          >
            <X size={20} className="text-gray-600" />
          </button>
          <h2 className="text-center font-bold text-gray-800 text-lg">Rules</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="text-rose-500 font-bold text-lg">【Promotion partner】program</h3>
            <p className="text-gray-500 text-sm mt-1">This activity is valid for a long time</p>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="relative">
                {/* Number Badge */}
                <div className="flex justify-center mb-2">
                  <div className="bg-gradient-to-r from-rose-400 to-rose-500 text-white text-sm font-bold py-1.5 px-8 rounded-full shadow-md">
                    {rule.number}
                  </div>
                </div>
                
                {/* Rule Content */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {rule.content}
                  </p>
                  {rule.number === "06" && onViewRebateRatio && (
                    <button
                      onClick={onViewRebateRatio}
                      className="text-rose-500 text-sm font-medium mt-2 hover:underline"
                    >
                      View rebate ratio →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Level Tiers Table (shown after rule 05) */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 py-2 px-3">
              <div className="text-xs font-semibold text-gray-600">Rebate level</div>
              <div className="text-xs font-semibold text-gray-600 text-center">Team Number</div>
              <div className="text-xs font-semibold text-gray-600 text-center">Team Betting</div>
              <div className="text-xs font-semibold text-gray-600 text-center">Team Deposit</div>
            </div>
            
            {levelTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-4 py-3 px-3 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                } ${index !== levelTiers.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{tier.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{tier.level}</span>
                </div>
                <div className="text-center text-sm text-gray-600">{tier.teamNumber}</div>
                <div className="text-center text-sm text-gray-600">{tier.teamBetting}</div>
                <div className="text-center text-sm text-gray-600">{tier.teamDeposit}</div>
              </div>
            ))}
          </div>

          {/* Bottom Padding */}
          <div className="h-24"></div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-rose-400 to-transparent pointer-events-none flex items-end justify-center pb-6">
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationRulesModal;
