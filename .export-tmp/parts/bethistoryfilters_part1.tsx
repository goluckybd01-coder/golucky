import React, { useState } from "react";
import { Filter, ArrowUpDown, ChevronDown, Calendar, Download, FileText, FileSpreadsheet, Search, X, TrendingUp, TrendingDown, Wallet, Table } from "lucide-react";
import { type BetHistoryItem } from "@/lib/gameStorage";
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from "date-fns";
import { toast } from "sonner";

export type FilterStatus = "all" | "win" | "lose" | "pending";
export type SortOption = "newest" | "oldest" | "highest_bet" | "lowest_bet" | "highest_payout";
export type DateRange = "all" | "today" | "yesterday" | "this_week" | "this_month";

interface BetHistoryFiltersProps {
  onFilterChange: (status: FilterStatus) => void;
  onSortChange: (sort: SortOption) => void;
  onDateRangeChange: (range: DateRange) => void;
  onSearchChange: (query: string) => void;
  currentFilter: FilterStatus;
  currentSort: SortOption;
  currentDateRange: DateRange;
  searchQuery: string;
  totalCount: number;
  filteredCount: number;
  filteredHistory?: BetHistoryItem[];
  gameName?: string;
}

const filterOptions: { value: FilterStatus; label: string; color: string }[] = [
  { value: "all", label: "সব", color: "bg-gray-600" },
  { value: "win", label: "জয়", color: "bg-green-600" },
  { value: "lose", label: "হার", color: "bg-red-600" },
  { value: "pending", label: "পেন্ডিং", color: "bg-yellow-600" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "নতুন আগে" },
  { value: "oldest", label: "পুরাতন আগে" },
  { value: "highest_bet", label: "সর্বোচ্চ বেট" },
  { value: "lowest_bet", label: "সর্বনিম্ন বেট" },
  { value: "highest_payout", label: "সর্বোচ্চ পেআউট" },
];

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "all", label: "সব সময়" },
  { value: "today", label: "আজ" },
  { value: "yesterday", label: "গতকাল" },
  { value: "this_week", label: "এই সপ্তাহ" },
  { value: "this_month", label: "এই মাস" },
];

export const BetHistoryFilters: React.FC<BetHistoryFiltersProps> = ({
  onFilterChange,
  onSortChange,
  onDateRangeChange,
  onSearchChange,
  currentFilter,
  currentSort,
  currentDateRange,
  searchQuery,
  totalCount,
  filteredCount,
  filteredHistory = [],
  gameName = "Game",
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const currentFilterLabel = filterOptions.find(f => f.value === currentFilter)?.label || "সব";
  const currentSortLabel = sortOptions.find(s => s.value === currentSort)?.label || "নতুন আগে";
  const currentDateLabel = dateRangeOptions.find(d => d.value === currentDateRange)?.label || "সব সময়";

  const closeAllDropdowns = () => {
    setShowFilterDropdown(false);
    setShowSortDropdown(false);
    setShowDateDropdown(false);
    setShowExportDropdown(false);
  };

  // Export to CSV with detailed information
  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("এক্সপোর্ট করার জন্য কোন ডেটা নেই");
      return;
    }

    const headers = [
      "Period", 
      "Date/Time", 
      "Bet Type", 
      "Bet Amount (৳)", 
      "Fee (৳)", 
      "Net Amount (৳)", 
      "Result", 
      "Status", 
      "Payout (৳)", 
      "Net P/L (৳)"
    ];
    
    const rows = filteredHistory.map(bet => {
      const fee = bet.fee || (bet.betAmount * 0.02);
      const netAmount = bet.netAmount || (bet.betAmount - fee);
      const payout = bet.isWin ? (bet.payout || 0) : 0;
      const netPL = bet.result === null ? 0 : (bet.isWin ? payout - bet.betAmount : -bet.betAmount);
      const timestamp = bet.timestamp ? format(new Date(bet.timestamp), "yyyy-MM-dd HH:mm:ss") : "-";
      
      return [
        bet.period,
        timestamp,
        bet.betType,
        bet.betAmount.toString(),
        fee.toFixed(2),
        netAmount.toFixed(2),
        bet.result !== null ? bet.result.toString() : "-",
        bet.result === null ? "Pending" : bet.isWin ? "Win" : "Lose",
        payout > 0 ? `+${payout.toFixed(2)}` : "0",
        netPL > 0 ? `+${netPL.toFixed(2)}` : netPL.toFixed(2)
      ];
    });

    // Add summary row
    const totalBet = filteredHistory.reduce((sum, b) => sum + b.betAmount, 0);
    const totalWin = filteredHistory.filter(b => b.isWin).reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalLoss = filteredHistory.filter(b => !b.isWin && b.result !== null).reduce((sum, b) => sum + b.betAmount, 0);
    const netProfit = totalWin - totalLoss;
    
    rows.push([]);
    rows.push(["=== SUMMARY ===", "", "", "", "", "", "", "", "", ""]);
    rows.push(["Total Bets", filteredHistory.length.toString(), "", totalBet.toFixed(2), "", "", "", "", totalWin.toFixed(2), netProfit >= 0 ? `+${netProfit.toFixed(2)}` : netProfit.toFixed(2)]);
    rows.push(["Win Rate", `${((filteredHistory.filter(b => b.isWin).length / Math.max(1, filteredHistory.filter(b => b.result !== null).length)) * 100).toFixed(1)}%`, "", "", "", "", "", "", "", ""]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gameName}_bet_history_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`${filteredHistory.length}টি রেকর্ড CSV এ এক্সপোর্ট হয়েছে`, {
      description: "ফাইল ডাউনলোড হয়েছে"
    });
    setShowExportDropdown(false);
  };
