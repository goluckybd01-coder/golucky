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
