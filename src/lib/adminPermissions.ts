// Admin Permission System
// Role-Based Access Control + Game-Scoped Permissions
// Industry Standard 4-Role System: Super Admin, Finance Admin, Game Admin, Support Admin

import type { StaffRole } from "@/lib/staffRoles";
export type { StaffRole } from "@/lib/staffRoles";


// UI display maps 'support' to 'Support Admin'
export type StaffRoleDisplay = 'Super Admin' | 'Finance Admin' | 'Game Admin' | 'Support Admin';

export type Permission =
  // Dashboard
  | 'DASHBOARD_ACCESS'
  // User Management
  | 'USER_VIEW'
  | 'USER_BLOCK'
  | 'USER_DELETE'
  | 'USER_PASSWORD_RESET'
  // Agent Management
  | 'AGENT_VIEW'
  | 'AGENT_APPROVE'
  | 'AGENT_FREEZE'
  // Finance
  | 'DEPOSIT_VIEW'
  | 'DEPOSIT_APPROVE'
  | 'WITHDRAW_VIEW'
  | 'WITHDRAW_APPROVE'
  | 'TRANSACTION_VIEW'
  | 'FINANCE_REPORTS'
  | 'USER_BALANCE_VIEW'
  // Game Control
  | 'GAME_VIEW'
  | 'GAME_RESULT_CONTROL'
  | 'GAME_ODDS_CONTROL'
  | 'GAME_ROUND_CONTROL'
  | 'GAME_LOGS_VIEW'
  // System
  | 'SYSTEM_SETTINGS'
  | 'API_GATEWAY_SETTINGS'
  | 'ROLE_PERMISSION_EDIT'
  | 'ADMIN_CREATE_DELETE'
  | 'AUDIT_LOGS_VIEW'
  // Support
  | 'SUPPORT_INBOX'
  | 'SUPPORT_LIVE_CHAT';

export type GameType = 'wingo' | 'k3' | '5d' | 'trxwin' | 'crash' | 'mines' | 'aviator';

export const ALL_GAMES: GameType[] = ['wingo', 'k3', '5d', 'trxwin', 'crash', 'mines', 'aviator'];

// ============================================
// ROLE PERMISSIONS - Industry Standard Setup
// ============================================

// Super Admin: Full access (Owner level) - ALL permissions ON
export const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  'DASHBOARD_ACCESS',
  'USER_VIEW', 'USER_BLOCK', 'USER_DELETE', 'USER_PASSWORD_RESET',
  'AGENT_VIEW', 'AGENT_APPROVE', 'AGENT_FREEZE',
  'DEPOSIT_VIEW', 'DEPOSIT_APPROVE',
  'WITHDRAW_VIEW', 'WITHDRAW_APPROVE',
  'TRANSACTION_VIEW', 'FINANCE_REPORTS', 'USER_BALANCE_VIEW',
  'GAME_VIEW', 'GAME_RESULT_CONTROL', 'GAME_ODDS_CONTROL', 'GAME_ROUND_CONTROL', 'GAME_LOGS_VIEW',
  'SYSTEM_SETTINGS', 'API_GATEWAY_SETTINGS', 'ROLE_PERMISSION_EDIT', 'ADMIN_CREATE_DELETE',
  'AUDIT_LOGS_VIEW',
  'SUPPORT_INBOX', 'SUPPORT_LIVE_CHAT'
];

// Finance Admin: Deposit/Withdraw management only
export const FINANCE_ADMIN_PERMISSIONS: Permission[] = [
  'DASHBOARD_ACCESS',
  'DEPOSIT_VIEW', 'DEPOSIT_APPROVE',
  'WITHDRAW_VIEW', 'WITHDRAW_APPROVE',
  'TRANSACTION_VIEW', 'FINANCE_REPORTS', 'USER_BALANCE_VIEW'
];

// Game Admin: Game control only
export const GAME_ADMIN_PERMISSIONS: Permission[] = [
  'DASHBOARD_ACCESS',
  'GAME_VIEW', 'GAME_RESULT_CONTROL', 'GAME_ODDS_CONTROL', 'GAME_ROUND_CONTROL', 'GAME_LOGS_VIEW'
];

// Support Admin: User support only
export const SUPPORT_ADMIN_PERMISSIONS: Permission[] = [
  'DASHBOARD_ACCESS',
  'USER_VIEW', 'USER_BLOCK', 'USER_PASSWORD_RESET',
  'TRANSACTION_VIEW', // View only, not edit
  'SUPPORT_INBOX', 'SUPPORT_LIVE_CHAT'
];

// Default permissions per role
export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  finance_admin: FINANCE_ADMIN_PERMISSIONS,
  game_admin: GAME_ADMIN_PERMISSIONS,
  agent_admin: ['DASHBOARD_ACCESS', 'AGENT_VIEW', 'AGENT_APPROVE', 'AGENT_FREEZE', 'USER_VIEW'],
  support: SUPPORT_ADMIN_PERMISSIONS
};


// All available permissions grouped by category
export const PERMISSION_CATEGORIES = {
  dashboard: {
    label: 'Dashboard',
    permissions: ['DASHBOARD_ACCESS'] as Permission[]
  },
  users: {
    label: 'User Management',
    permissions: ['USER_VIEW', 'USER_BLOCK', 'USER_DELETE', 'USER_PASSWORD_RESET'] as Permission[]
  },
  agents: {
    label: 'Agent Management',
    permissions: ['AGENT_VIEW', 'AGENT_APPROVE', 'AGENT_FREEZE'] as Permission[]
  },
  finance: {
    label: 'Finance',
    permissions: ['DEPOSIT_VIEW', 'DEPOSIT_APPROVE', 'WITHDRAW_VIEW', 'WITHDRAW_APPROVE', 'TRANSACTION_VIEW', 'FINANCE_REPORTS', 'USER_BALANCE_VIEW'] as Permission[]
  },
  games: {
    label: 'Game Control',
    permissions: ['GAME_VIEW', 'GAME_RESULT_CONTROL', 'GAME_ODDS_CONTROL', 'GAME_ROUND_CONTROL', 'GAME_LOGS_VIEW'] as Permission[]
  },
  system: {
    label: 'System',
    permissions: ['SYSTEM_SETTINGS', 'API_GATEWAY_SETTINGS', 'ROLE_PERMISSION_EDIT', 'ADMIN_CREATE_DELETE', 'AUDIT_LOGS_VIEW'] as Permission[]
  },
  support: {
    label: 'Support',
    permissions: ['SUPPORT_INBOX', 'SUPPORT_LIVE_CHAT'] as Permission[]
  }
};

// Human-readable permission labels
export const PERMISSION_LABELS: Record<Permission, string> = {
  DASHBOARD_ACCESS: 'Dashboard Access',
  USER_VIEW: 'View Users',
  USER_BLOCK: 'Block/Unblock Users',
  USER_DELETE: 'Delete Users',
  USER_PASSWORD_RESET: 'Reset User Password',
  AGENT_VIEW: 'View Agents',
  AGENT_APPROVE: 'Approve Agents',
  AGENT_FREEZE: 'Freeze Agents',
  DEPOSIT_VIEW: 'View Deposits',
  DEPOSIT_APPROVE: 'Approve/Reject Deposits',
  WITHDRAW_VIEW: 'View Withdrawals',
  WITHDRAW_APPROVE: 'Approve/Reject Withdrawals',
  TRANSACTION_VIEW: 'View Transactions',
  FINANCE_REPORTS: 'Finance Reports',
  USER_BALANCE_VIEW: 'View User Balance',
  GAME_VIEW: 'View Games',
  GAME_RESULT_CONTROL: 'Control Game Results',
  GAME_ODDS_CONTROL: 'Control Game Odds/Multiplier',
  GAME_ROUND_CONTROL: 'Start/Stop Game Rounds',
  GAME_LOGS_VIEW: 'View Game Logs',
  SYSTEM_SETTINGS: 'System Settings',
  API_GATEWAY_SETTINGS: 'API/Gateway Settings',
  ROLE_PERMISSION_EDIT: 'Edit Roles & Permissions',
  ADMIN_CREATE_DELETE: 'Create/Delete Admins',
  AUDIT_LOGS_VIEW: 'View Audit Logs',
  SUPPORT_INBOX: 'Support Inbox',
  SUPPORT_LIVE_CHAT: 'Live Chat Support'
};

// Module access rules
export const MODULE_PERMISSIONS: Record<string, Permission[]> = {
  overview: ['DASHBOARD_ACCESS'],
  finance: ['DEPOSIT_VIEW', 'WITHDRAW_VIEW'],
  deposits: ['DEPOSIT_VIEW'],
  withdrawals: ['WITHDRAW_VIEW'],
  bets: ['GAME_VIEW', 'TRANSACTION_VIEW'],
  profit: ['FINANCE_REPORTS'],
  agents: ['AGENT_VIEW'],
  users: ['USER_VIEW'],
  games: ['GAME_VIEW'],
  staff: ['ADMIN_CREATE_DELETE'],
  settings: ['SYSTEM_SETTINGS'],
  audit: ['AUDIT_LOGS_VIEW'],
  support: ['SUPPORT_INBOX']
};

// Role labels (display 'Support Admin' in UI for 'support' role)
export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  finance_admin: 'Finance Admin',
  game_admin: 'Game Admin',
  agent_admin: 'Agent Admin',
  support: 'Support Admin'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  super_admin: 'Full access to all features (Owner level)',
  finance_admin: 'Deposit & Withdraw management only',
  game_admin: 'Game control & result management only',
  agent_admin: 'Agent management & approval only',
  support: 'User support & live chat only'
};

// Role colors
export const ROLE_COLORS: Record<StaffRole, { bg: string; text: string; border: string }> = {
  super_admin: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  finance_admin: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  game_admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  agent_admin: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },

  support: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
};

// Game icons and labels
export const GAME_CONFIG: Record<GameType, { label: string; icon: string; color: string; gradient: string }> = {
  wingo: { label: 'WinGo', icon: 'Target', color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  k3: { label: 'K3', icon: 'Dices', color: 'text-blue-400', gradient: 'from-blue-500 to-purple-500' },
  '5d': { label: '5D', icon: 'Trophy', color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
  trxwin: { label: 'TRX Win', icon: 'Zap', color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
  crash: { label: 'Crash', icon: 'Rocket', color: 'text-red-400', gradient: 'from-red-500 to-pink-500' },
  mines: { label: 'Mines', icon: 'Bomb', color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
  aviator: { label: 'Aviator', icon: 'Plane', color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' }
};

// Helper functions
export const hasPermission = (userPermissions: Permission[], required: Permission | Permission[]): boolean => {
  const requiredPerms = Array.isArray(required) ? required : [required];
  return requiredPerms.some(p => userPermissions.includes(p));
};

export const hasAllPermissions = (userPermissions: Permission[], required: Permission[]): boolean => {
  return required.every(p => userPermissions.includes(p));
};

export const canAccessModule = (role: StaffRole, permissions: Permission[], module: string): boolean => {
  if (role === 'super_admin') return true;
  
  const requiredPerms = MODULE_PERMISSIONS[module] || [];
  if (requiredPerms.length === 0) return true;
  
  return hasPermission(permissions, requiredPerms);
};

export const canAccessGame = (
  role: StaffRole, 
  gameScopes: { game_scope: string; can_view: boolean; can_edit: boolean; can_override: boolean }[],
  game: GameType,
  accessType: 'view' | 'edit' | 'override' = 'view'
): boolean => {
  if (role === 'super_admin') return true;
  
  const scope = gameScopes.find(s => s.game_scope === game || s.game_scope === 'all');
  if (!scope) return false;
  
  switch (accessType) {
    case 'view': return scope.can_view;
    case 'edit': return scope.can_edit;
    case 'override': return scope.can_override;
    default: return false;
  }
};

// Get role badge color classes
export const getRoleBadgeClasses = (role: StaffRole): string => {
  const colors = ROLE_COLORS[role];
  return `${colors.bg} ${colors.text} ${colors.border} border`;
};
