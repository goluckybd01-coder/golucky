import { useState } from "react";
import { ChevronLeft, Search, Copy, Check, ChevronDown, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";

interface SubordinateDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subordinates: {
    id: string;
    created_at: string;
    wallet?: {
      total_deposit: number;
      total_bet: number;
    } | null;
  }[];
}

const SubordinateDataModal = ({ open, onOpenChange, subordinates }: SubordinateDataModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  // Calculate stats
  const depositNumber = subordinates.filter(s => s.wallet && s.wallet.total_deposit > 0).length;
  const depositAmount = subordinates.reduce((sum, s) => sum + (s.wallet?.total_deposit || 0), 0);
  const numberOfBettors = subordinates.filter(s => s.wallet && s.wallet.total_bet > 0).length;
  const totalBet = subordinates.reduce((sum, s) => sum + (s.wallet?.total_bet || 0), 0);
  const firstDepositCount = depositNumber; // Users who made first deposit
  const firstDepositAmount = depositAmount;

  const handleCopyUID = (id: string) => {
    const shortId = id.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(shortId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSubordinates = subordinates.filter(sub => {
    if (!searchQuery) return true;
    return sub.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => onOpenChange(false)} className="p-1">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <SheetTitle className="text-lg font-bold text-gray-800">Subordinate data</SheetTitle>
            <div className="w-8" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search subordinate UID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <button className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-3 rounded-xl">
              <Search size={20} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-3">
            <button className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
              <span className="text-gray-700 text-sm">All</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            <button className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
              <span className="text-gray-700 text-sm">{format(new Date(), "yyyy-MM-dd")}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 rounded-2xl p-4 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{depositNumber}</p>
                <p className="text-white/80 text-xs mt-1">Deposit number</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{depositAmount.toLocaleString()}</p>
                <p className="text-white/80 text-xs mt-1">Deposit amount</p>
              </div>
              <div className="text-center border-t border-white/20 pt-3">
                <p className="text-2xl font-bold">{numberOfBettors}</p>
                <p className="text-white/80 text-xs mt-1">Number of bettors</p>
              </div>
              <div className="text-center border-t border-white/20 pt-3">
                <p className="text-2xl font-bold">{totalBet.toLocaleString()}</p>
                <p className="text-white/80 text-xs mt-1">Total bet</p>
              </div>
              <div className="text-center border-t border-white/20 pt-3">
                <p className="text-2xl font-bold">{firstDepositCount}</p>
                <p className="text-white/80 text-xs mt-1">Number of people making first deposit</p>
              </div>
              <div className="text-center border-t border-white/20 pt-3">
                <p className="text-2xl font-bold">{firstDepositAmount.toLocaleString()}</p>
                <p className="text-white/80 text-xs mt-1">First deposit amount</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subordinate List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {filteredSubordinates.length > 0 ? (
            <div className="space-y-3">
              {filteredSubordinates.map((sub, index) => {
                const shortId = `UID:${(100451 + index).toString()}`;
                const commission = Math.floor((sub.wallet?.total_bet || 0) * 0.006); // 0.6% commission
                
                return (
                  <div key={sub.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-gray-800">{shortId}</span>
                      <button
                        onClick={() => handleCopyUID(sub.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedId === sub.id ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Level</span>
                        <span className="text-gray-800">1</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deposit amount</span>
                        <span className={`${(sub.wallet?.total_deposit || 0) > 0 ? "text-teal-600" : "text-gray-400"}`}>
                          {(sub.wallet?.total_deposit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Commission</span>
                        <span className={`${commission > 0 ? "text-amber-600" : "text-gray-400"}`}>
                          {commission.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Time</span>
                        <span className="text-gray-400">
                          {format(new Date(sub.created_at), "yyyy-MM-dd")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="mx-auto mb-3 opacity-50" size={48} />
              <p className="text-sm">No subordinates yet</p>
              <p className="text-xs mt-1">Invite friends to start earning</p>
            </div>
          )}

          {filteredSubordinates.length > 0 && (
            <p className="text-center text-gray-400 text-sm mt-4">No more</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubordinateDataModal;
