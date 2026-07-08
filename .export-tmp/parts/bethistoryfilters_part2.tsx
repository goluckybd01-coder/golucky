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
