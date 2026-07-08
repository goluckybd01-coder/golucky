/**
 * CSV Export Utility for Game History Data
 */

export interface ChartExportItem {
  period: string;
  digits: number[];
  sum: number;
  size: "Big" | "Small";
  parity: "Odd" | "Even";
}

export interface BetHistoryExportItem {
  period: string;
  betType: string;
  betAmount: number;
  isWin: boolean | null;
  payout?: number;
  timestamp?: string;
}

export function chartHistoryToCSV(data: ChartExportItem[], gameName: string = "5D"): string {
  const headers = ["Period", "Digit A", "Digit B", "Digit C", "Digit D", "Digit E", "Sum", "Big/Small", "Odd/Even"];
  const rows = data.map(item => {
    const [a, b, c, d, e] = item.digits || [0, 0, 0, 0, 0];
    return [item.period, a, b, c, d, e, item.sum, item.size, item.parity].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function betHistoryToCSV(data: BetHistoryExportItem[], gameName: string = "5D"): string {
  const headers = ["Period", "Bet Type", "Bet Amount", "Result", "Payout"];
  const rows = data.map(item => {
    const result = item.isWin === null ? "Pending" : item.isWin ? "Won" : "Lost";
    return [item.period, `"${item.betType}"`, item.betAmount, result, item.payout || 0].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportChartHistory(data: ChartExportItem[], gameName: string = "5D"): void {
  const csvContent = chartHistoryToCSV(data, gameName);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `${gameName}_chart_history_${timestamp}.csv`);
}

export function exportBetHistory(data: BetHistoryExportItem[], gameName: string = "5D"): void {
  const csvContent = betHistoryToCSV(data, gameName);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `${gameName}_bet_history_${timestamp}.csv`);
}

export interface UserTransactionExportItem {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  game_type: string | null;
  trade_id: string | null;
  created_at: string;
}

export function userTransactionsToCSV(data: UserTransactionExportItem[], username: string = "User"): string {
  const headers = ["Date", "Time", "Type", "Amount", "Balance After", "Description", "Game Type", "Trade ID"];
  const rows = data.map(item => {
    const date = new Date(item.created_at);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      item.type,
      item.amount,
      item.balance_after,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.game_type || '',
      item.trade_id || ''
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportUserTransactions(data: UserTransactionExportItem[], username: string = "User", userId?: string): void {
  const csvContent = userTransactionsToCSV(data, username);
  const timestamp = new Date().toISOString().slice(0, 10);
  const userPart = username !== "User" ? username.replace(/[^a-zA-Z0-9]/g, '_') : userId?.slice(0, 8) || 'unknown';
  downloadCSV(csvContent, `${userPart}_transactions_${timestamp}.csv`);
}

export interface UserBetExportItem {
  id: string;
  game_type: string;
  game_mode: string;
  bet_type: string;
  bet_value: string;
  bet_amount: number;
  multiplier: number;
  potential_win: number;
  payout: number | null;
  status: string;
  result: string | null;
  trade_id: string;
  created_at: string;
  settled_at: string | null;
}

export function userBetsToCSV(data: UserBetExportItem[], username: string = "User"): string {
  const headers = ["Date", "Time", "Game", "Mode", "Bet Type", "Bet Value", "Amount", "Multiplier", "Potential Win", "Payout", "Status", "Result", "Trade ID"];
  const rows = data.map(item => {
    const date = new Date(item.created_at);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      item.game_type,
      item.game_mode,
      `"${item.bet_type}"`,
      `"${item.bet_value}"`,
      item.bet_amount,
      item.multiplier,
      item.potential_win,
      item.payout || 0,
      item.status,
      item.result || '',
      item.trade_id
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportUserBets(data: UserBetExportItem[], username: string = "User", userId?: string): void {
  const csvContent = userBetsToCSV(data, username);
  const timestamp = new Date().toISOString().slice(0, 10);
  const userPart = username !== "User" ? username.replace(/[^a-zA-Z0-9]/g, '_') : userId?.slice(0, 8) || 'unknown';
  downloadCSV(csvContent, `${userPart}_bets_${timestamp}.csv`);
}

export interface NotificationExportItem {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  priority?: string;
  is_read?: boolean;
  escalation_count?: number;
  acknowledged_at?: string | null;
  recipients?: string[] | null;
  created_at: string;
}

export function notificationHistoryToCSV(data: NotificationExportItem[]): string {
  const headers = ["Date", "Time", "Type", "Priority", "Title", "Message", "Status", "Escalations", "Acknowledged"];
  const rows = data.map(item => {
    const date = new Date(item.created_at);
    const type = item.notification_type === 'new_transaction_request' ? 'New Request' : 
                 item.notification_type === 'pending_requests_alert' ? 'Pending Alert' :
                 item.notification_type === 'test_alert' ? 'Test Alert' :
                 item.notification_type.replace(/_/g, ' ');
    const status = item.is_read ? 'Read' : 'Unread';
    const acknowledged = item.acknowledged_at ? new Date(item.acknowledged_at).toLocaleString() : '';
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${type}"`,
      item.priority || '',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`,
      status,
      item.escalation_count || 0,
      `"${acknowledged}"`
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportNotificationHistory(data: NotificationExportItem[], startDate?: Date, endDate?: Date): void {
  const csvContent = notificationHistoryToCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  let filename = `notification_history_${timestamp}.csv`;
  if (startDate && endDate) {
    filename = `notification_history_${startDate.toISOString().slice(0, 10)}_to_${endDate.toISOString().slice(0, 10)}.csv`;
  }
  downloadCSV(csvContent, filename);
}

export interface UserListExportItem {
  display_user_id: string | null;
  username: string | null;
  phone: string | null;
  balance: number;
  total_deposit: number;
  total_withdraw: number;
  total_bet: number;
  total_win: number;
  vip_level: number;
  vip_exp: number;
  referral_code: string | null;
  is_admin: boolean;
  created_at: string;
  last_active: string | null;
}

export function userListToCSV(data: UserListExportItem[]): string {
  const headers = ["User ID", "Username", "Phone", "Balance", "Total Deposit", "Total Withdraw", "Total Bet", "Total Win", "Net Profit", "Win Rate %", "VIP Level", "VIP EXP", "Referral Code", "Is Admin", "Joined Date", "Last Active"];
  const rows = data.map(item => {
    const netProfit = item.total_win - item.total_bet;
    const winRate = item.total_bet > 0 ? ((item.total_win / item.total_bet) * 100).toFixed(2) : "0.00";
    return [
      item.display_user_id || '',
      `"${(item.username || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      item.balance,
      item.total_deposit,
      item.total_withdraw,
      item.total_bet,
      item.total_win,
      netProfit,
      winRate,
      item.vip_level,
      item.vip_exp,
      item.referral_code || '',
      item.is_admin ? 'Yes' : 'No',
      new Date(item.created_at).toLocaleDateString(),
      item.last_active ? new Date(item.last_active).toLocaleDateString() : 'Never'
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportUserList(data: UserListExportItem[], filterLabel?: string): void {
  const csvContent = userListToCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filterPart = filterLabel ? `_${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  downloadCSV(csvContent, `users${filterPart}_${timestamp}.csv`);
}

export interface TransactionRequestExportItem {
  id: string;
  user_id: string;
  username?: string | null;
  phone?: string | null;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_details: unknown;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

export function transactionRequestsToCSV(data: TransactionRequestExportItem[]): string {
  const headers = ["Request ID", "Date", "Time", "User", "Phone", "Type", "Amount (৳)", "Status", "Payment Method", "Admin Notes", "Processed At"];
  const rows = data.map(item => {
    const date = new Date(item.created_at);
    const processedAt = item.processed_at ? new Date(item.processed_at).toLocaleString() : '';
    return [
      item.id.slice(0, 8),
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${(item.username || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.amount,
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
      item.payment_method || '',
      `"${(item.admin_notes || '').replace(/"/g, '""')}"`,
      `"${processedAt}"`
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportTransactionRequests(data: TransactionRequestExportItem[], filterLabel?: string): void {
  const csvContent = transactionRequestsToCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filterPart = filterLabel ? `_${filterLabel.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  downloadCSV(csvContent, `transaction_requests${filterPart}_${timestamp}.csv`);
}

export interface AgentCommissionExportItem {
  agent_code: string;
  username: string | null;
  display_user_id: string | null;
  agent_tier: string;
  referral_count: number;
  total_deposit_commission: number;
  total_betting_commission: number;
  total_commission: number;
  commission_count: number;
}

export function agentCommissionsToCSV(data: AgentCommissionExportItem[]): string {
  const headers = ["Agent Code", "Username", "User ID", "Tier", "Referrals", "Deposit Comm. (৳)", "Betting Comm. (৳)", "Total Comm. (৳)", "Transactions"];
  const rows = data.map(item => [
    item.agent_code,
    `"${(item.username || 'Anonymous').replace(/"/g, '""')}"`,
    item.display_user_id || '',
    item.agent_tier.charAt(0).toUpperCase() + item.agent_tier.slice(1),
    item.referral_count,
    item.total_deposit_commission.toFixed(2),
    item.total_betting_commission.toFixed(2),
    item.total_commission.toFixed(2),
    item.commission_count
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function exportAgentCommissions(data: AgentCommissionExportItem[], dateRange?: { from?: Date; to?: Date }): void {
  const csvContent = agentCommissionsToCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  let filename = `agent_commissions_${timestamp}.csv`;
  if (dateRange?.from && dateRange?.to) {
    filename = `agent_commissions_${dateRange.from.toISOString().slice(0, 10)}_to_${dateRange.to.toISOString().slice(0, 10)}.csv`;
  }
  downloadCSV(csvContent, filename);
}
