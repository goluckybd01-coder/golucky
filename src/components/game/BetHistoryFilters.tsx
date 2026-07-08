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
  // Export to Excel (Tab-separated for better Excel compatibility)
  const exportToExcel = () => {
    if (filteredHistory.length === 0) {
      toast.error("এক্সপোর্ট করার জন্য কোন ডেটা নেই");
      return;
    }

    const headers = [
      "Period", 
      "Date/Time", 
      "Bet Type", 
      "Bet Amount", 
      "Fee", 
      "Net Amount", 
      "Result", 
      "Status", 
      "Payout", 
      "Net P/L"
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
        bet.betAmount,
        fee,
        netAmount,
        bet.result !== null ? bet.result : "-",
        bet.result === null ? "Pending" : bet.isWin ? "Win" : "Lose",
        payout,
        netPL
      ];
    });

    // Add summary
    const totalBet = filteredHistory.reduce((sum, b) => sum + b.betAmount, 0);
    const totalWin = filteredHistory.filter(b => b.isWin).reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalLoss = filteredHistory.filter(b => !b.isWin && b.result !== null).reduce((sum, b) => sum + b.betAmount, 0);
    const netProfit = totalWin - totalLoss;
    const winRate = (filteredHistory.filter(b => b.isWin).length / Math.max(1, filteredHistory.filter(b => b.result !== null).length)) * 100;
    
    rows.push([]);
    rows.push(["SUMMARY", "", "", "", "", "", "", "", "", ""]);
    rows.push(["Total Bets", filteredHistory.length, "", totalBet, "", "", "", "", totalWin, netProfit]);
    rows.push(["Win Rate", `${winRate.toFixed(1)}%`, "", "", "", "", "", "", "", ""]);

    // Use tab separator for better Excel compatibility
    const tsvContent = [
      headers.join("\t"),
      ...rows.map(row => row.join("\t"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gameName}_bet_history_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`${filteredHistory.length}টি রেকর্ড Excel এ এক্সপোর্ট হয়েছে`, {
      description: "ফাইল ডাউনলোড হয়েছে"
    });
    setShowExportDropdown(false);
  };

  // Export to PDF (HTML-based print)
  const exportToPDF = () => {
    if (filteredHistory.length === 0) {
      toast.error("এক্সপোর্ট করার জন্য কোন ডেটা নেই");
      return;
    }

    const totalBet = filteredHistory.reduce((sum, b) => sum + b.betAmount, 0);
    const totalWin = filteredHistory.filter(b => b.isWin).reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalLoss = filteredHistory.filter(b => !b.isWin && b.result !== null).reduce((sum, b) => sum + b.betAmount, 0);
    const netProfit = totalWin - totalLoss;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("পপ-আপ ব্লক করা হয়েছে। অনুগ্রহ করে পপ-আপ অনুমতি দিন।");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${gameName} - Bet History Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f97316; }
          .header h1 { color: #f97316; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .summary { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
          .summary-card { flex: 1; min-width: 120px; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card.total { background: #f0f9ff; border: 1px solid #0ea5e9; }
          .summary-card.win { background: #f0fdf4; border: 1px solid #22c55e; }
          .summary-card.loss { background: #fef2f2; border: 1px solid #ef4444; }
          .summary-card.net { background: ${netProfit >= 0 ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${netProfit >= 0 ? '#22c55e' : '#ef4444'}; }
          .summary-card h3 { font-size: 11px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
          .summary-card p { font-size: 18px; font-weight: bold; }
          .summary-card.total p { color: #0ea5e9; }
          .summary-card.win p { color: #22c55e; }
          .summary-card.loss p { color: #ef4444; }
          .summary-card.net p { color: ${netProfit >= 0 ? '#22c55e' : '#ef4444'}; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .status-win { color: #22c55e; font-weight: bold; }
          .status-lose { color: #ef4444; font-weight: bold; }
          .status-pending { color: #eab308; font-weight: bold; }
          .payout-win { color: #22c55e; font-weight: bold; }
          .payout-lose { color: #ef4444; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
          @media print { body { padding: 10px; } .summary-card { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎮 ${gameName} - Bet History Report</h1>
          <p>Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")} | Total Records: ${filteredHistory.length}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card total">
            <h3>Total Bet</h3>
            <p>৳${totalBet.toLocaleString()}</p>
          </div>
          <div class="summary-card win">
            <h3>Total Win</h3>
            <p>৳${totalWin.toLocaleString()}</p>
          </div>
          <div class="summary-card loss">
            <h3>Total Loss</h3>
            <p>৳${totalLoss.toLocaleString()}</p>
          </div>
          <div class="summary-card net">
            <h3>Net Profit</h3>
            <p>${netProfit >= 0 ? '+' : ''}৳${netProfit.toLocaleString()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Period</th>
              <th>Bet Type</th>
              <th>Bet Amount</th>
              <th>Result</th>
              <th>Status</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            ${filteredHistory.map((bet, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${bet.period}</td>
                <td>${bet.betType}</td>
                <td>৳${bet.betAmount}</td>
                <td>${bet.result !== null ? bet.result : '-'}</td>
                <td class="${bet.result === null ? 'status-pending' : bet.isWin ? 'status-win' : 'status-lose'}">
                  ${bet.result === null ? 'Pending' : bet.isWin ? 'WIN' : 'LOSE'}
                </td>
                <td class="${bet.isWin ? 'payout-win' : 'payout-lose'}">
                  ${bet.isWin ? `+৳${(bet.payout || 0).toLocaleString()}` : bet.result !== null ? `-৳${bet.betAmount}` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated report. Please save as PDF using your browser's print function.</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast.success("PDF রিপোর্ট প্রিন্ট উইন্ডোতে খোলা হয়েছে");
    setShowExportDropdown(false);
  };
  return (
    <div className="flex flex-col gap-2 px-2 py-2 bg-card/50 rounded-lg border border-border/30 mb-2">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="পিরিয়ড নম্বর দিয়ে সার্চ করুন..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Date Range Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onDateRangeChange(option.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentDateRange === option.value
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {option.value !== "all" && <Calendar className="w-3 h-3" />}
            {option.label}
          </button>
        ))}
      </div>

      {/* Filter and Sort Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Filter Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowSortDropdown(false);
              setShowDateDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-all w-full justify-between border border-border/40"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground">{currentFilterLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange(option.value);
                    setShowFilterDropdown(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/70 transition-colors text-sm ${
                    currentFilter === option.value ? 'bg-muted text-primary' : 'text-foreground'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${option.color}`} />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowFilterDropdown(false);
              setShowDateDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-all w-full justify-between border border-border/40"
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground truncate">{currentSortLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-1 w-full bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/70 transition-colors text-sm ${
                    currentSort === option.value ? 'bg-muted text-primary' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Filter Chips + Export */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              currentFilter === option.value
                ? `${option.color} text-white shadow-md scale-105`
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
        
        {/* Export Dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => {
              setShowExportDropdown(!showExportDropdown);
              setShowFilterDropdown(false);
              setShowSortDropdown(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            <Download className="w-3 h-3" />
            এক্সপোর্ট
          </button>

          {showExportDropdown && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/70 transition-colors text-sm text-foreground"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                CSV ডাউনলোড
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/70 transition-colors text-sm text-foreground"
              >
                <Table className="w-4 h-4 text-emerald-600" />
                Excel ডাউনলোড
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/70 transition-colors text-sm text-foreground"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF রিপোর্ট
              </button>
            </div>
          )}
        </div>
        
        {/* Count Display */}
        <span className="text-xs text-muted-foreground">
          {filteredCount}/{totalCount}
        </span>
      </div>

      {/* Summary Stats */}
      {filteredHistory.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {(() => {
            const totalBet = filteredHistory.reduce((sum, b) => sum + b.betAmount, 0);
            const totalWin = filteredHistory.filter(b => b.isWin).reduce((sum, b) => sum + (b.payout || 0), 0);
            const totalLoss = filteredHistory.filter(b => !b.isWin && b.result !== null).reduce((sum, b) => sum + b.betAmount, 0);
            const netProfit = totalWin - totalLoss;
            
            return (
              <>
                <div className="flex flex-col items-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Wallet className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground">মোট বেট</span>
                  <span className="text-xs font-bold text-blue-600">৳{totalBet.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground">মোট জয়</span>
                  <span className="text-xs font-bold text-green-600">৳{totalWin.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground">মোট হার</span>
                  <span className="text-xs font-bold text-red-600">৳{totalLoss.toLocaleString()}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
                  {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mb-0.5" /> : <TrendingDown className="w-3.5 h-3.5 text-orange-500 mb-0.5" />}
                  <span className="text-[9px] text-muted-foreground">নেট প্রফিট</span>
                  <span className={`text-xs font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {netProfit >= 0 ? '+' : ''}৳{netProfit.toLocaleString()}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Utility function to filter and sort bet history
export const filterAndSortBetHistory = (
  history: BetHistoryItem[],
  filter: FilterStatus,
  sort: SortOption,
  dateRange: DateRange = "all",
  searchQuery: string = ""
): BetHistoryItem[] => {
  // First filter by search query
  let filtered = [...history];
  
  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((item) => 
      item.period.toLowerCase().includes(query)
    );
  }
  
  if (dateRange !== "all") {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "yesterday":
        startDate = startOfDay(subDays(now, 1));
        filtered = filtered.filter((item) => {
          const itemDate = parsePeriodToDate(item.period);
          return itemDate >= startDate && itemDate < startOfDay(now);
        });
        break;
      case "this_week":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        break;
      case "this_month":
        startDate = startOfMonth(now);
        break;
      default:
        startDate = new Date(0);
    }
    
    if (dateRange !== "yesterday") {
      filtered = filtered.filter((item) => {
        const itemDate = parsePeriodToDate(item.period);
        return itemDate >= startDate;
      });
    }
  }
  
  // Then filter by status
  if (filter !== "all") {
    filtered = filtered.filter((item) => {
      // Pending: result is null
      if (filter === "pending") return item.result === null;
      // Win: isWin is true
      if (filter === "win") return item.isWin === true;
      // Lose: isWin is false AND result is not null
      if (filter === "lose") return item.isWin === false && item.result !== null;
      return true;
    });
  }
  
  // Then sort
  filtered.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.period.localeCompare(b.period);
      case "highest_bet":
        return b.betAmount - a.betAmount;
      case "lowest_bet":
        return a.betAmount - b.betAmount;
      case "highest_payout":
        const payoutA = a.isWin ? a.payout || 0 : 0;
        const payoutB = b.isWin ? b.payout || 0 : 0;
        return payoutB - payoutA;
      case "newest":
      default:
        return b.period.localeCompare(a.period);
    }
  });
  
  return filtered;
};

// Helper to parse period string to Date
const parsePeriodToDate = (period: string): Date => {
  // Period format is typically "YYYYMMDDXXXXX" where YYYYMMDD is the date
  const dateStr = period.substring(0, 8);
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
  return new Date();
};

export default BetHistoryFilters;
