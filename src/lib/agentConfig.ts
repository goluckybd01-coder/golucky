// Agent System Configuration
// All amounts in Bangladeshi Taka (৳)

/**
 * ID & REFERRAL CODE FORMATS:
 * 
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  1. USER ID (Identity)                                          ║
 * ║     Format: GLU-YYYY-NNNNNN (e.g., GLU-2026-000001)              ║
 * ║     - Year-based sequential ID                                   ║
 * ║     - Used for support and admin lookups                         ║
 * ║     - NEVER editable after creation                              ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  2. USER REFERRAL CODE (Friend Referrals)                        ║
 * ║     Format: REF-U-XXXXXX (e.g., REF-U-000501)                    ║
 * ║     - Sequential numbering for regular users                     ║
 * ║     - Provides referral bonus on signup                          ║
 * ║     - One-time generated, immutable                              ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  3. AGENT DISPLAY ID (Agent Identity)                            ║
 * ║     Format: GLA-T#-XXXX (e.g., GLA-T4-0012)                      ║
 * ║     - # = Tier number (1-7): T1=Starter, T4=Gold, T7=Master      ║
 * ║     - Sequential numbering                                       ║
 * ║     - NEVER editable after creation                              ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  4. AGENT REFERRAL CODE (High Conversion)                        ║
 * ║     Format: AG-XXXXXX (e.g., AG-900001)                          ║
 * ║     - Used in registration: /register?ref=AG-900001              ║
 * ║     - Tracks: User registrations, deposits, betting volume       ║
 * ║     - Commission auto-calculated based on tier                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 * 
 * SECURITY RULES:
 * - UID & Agent ID → Never editable
 * - Referral codes → One-time generated
 * - All relations immutable after creation
 * - Every bonus/commission must have: Source UID, Timestamp, Game type, Audit log
 */

export type AgentTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite' | 'master';
export type AgentStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'frozen';

export const TIER_NUMBERS: Record<AgentTier, number> = {
  starter: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  diamond: 5,
  elite: 6,
  master: 7,
};

export const getTierNumber = (tier: AgentTier): number => TIER_NUMBERS[tier] || 0;

export interface AgentTierConfig {
  tier: AgentTier;
  name: string;
  minDeposit: number;
  depositCommissionRate: number;
  bettingCommissionRate: number;
  color: string;
  gradient: string;
  icon: string;
  benefits: string[];
}

export const AGENT_TIERS: AgentTierConfig[] = [
  {
    tier: 'starter',
    name: 'Starter Agent',
    minDeposit: 200000,
    depositCommissionRate: 2.0,
    bettingCommissionRate: 0.30,
    color: 'text-gray-400',
    gradient: 'from-gray-600 to-gray-700',
    icon: '🌱',
    benefits: [
      '2.0% deposit commission',
      '0.30% betting volume commission',
      'Basic referral dashboard',
      'User top-up capability',
    ],
  },
  {
    tier: 'bronze',
    name: 'Bronze Agent',
    minDeposit: 350000,
    depositCommissionRate: 2.2,
    bettingCommissionRate: 0.40,
    color: 'text-amber-600',
    gradient: 'from-amber-700 to-amber-800',
    icon: '🥉',
    benefits: [
      '2.2% deposit commission',
      '0.40% betting volume commission',
      'Priority support',
      'User top-up capability',
    ],
  },
  {
    tier: 'silver',
    name: 'Silver Agent',
    minDeposit: 500000,
    depositCommissionRate: 2.5,
    bettingCommissionRate: 0.50,
    color: 'text-slate-300',
    gradient: 'from-slate-500 to-slate-600',
    icon: '🥈',
    benefits: [
      '2.5% deposit commission',
      '0.50% betting volume commission',
      'Dedicated account manager',
      'Monthly performance bonus',
    ],
  },
  {
    tier: 'gold',
    name: 'Gold Agent',
    minDeposit: 800000,
    depositCommissionRate: 2.8,
    bettingCommissionRate: 0.80,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-amber-600',
    icon: '🥇',
    benefits: [
      '2.8% deposit commission',
      '0.80% betting volume commission',
      'Weekly payouts',
      'Custom promotional materials',
    ],
  },
  {
    tier: 'diamond',
    name: 'Diamond Agent',
    minDeposit: 1200000,
    depositCommissionRate: 3.0,
    bettingCommissionRate: 1.00,
    color: 'text-cyan-300',
    gradient: 'from-cyan-400 to-blue-500',
    icon: '💎',
    benefits: [
      '3.0% deposit commission',
      '1.00% betting volume commission',
      'VIP events access',
      'Exclusive bonus pool',
    ],
  },
  {
    tier: 'elite',
    name: 'Elite Agent',
    minDeposit: 1800000,
    depositCommissionRate: 3.3,
    bettingCommissionRate: 1.20,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-indigo-600',
    icon: '👑',
    benefits: [
      '3.3% deposit commission',
      '1.20% betting volume commission',
      'Monthly salary eligible',
      'Priority withdrawal processing',
    ],
  },
  {
    tier: 'master',
    name: 'Master Agent',
    minDeposit: 2500000,
    depositCommissionRate: 3.5,
    bettingCommissionRate: 1.50,
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-600',
    icon: '🏆',
    benefits: [
      '3.5% deposit commission',
      '1.50% betting volume commission',
      'Highest monthly salary',
      'Sub-agent recruitment rights',
      'Direct line to management',
    ],
  },
];

export const getTierConfig = (tier: AgentTier): AgentTierConfig | undefined => {
  return AGENT_TIERS.find(t => t.tier === tier);
};

export const getTierByDeposit = (deposit: number): AgentTierConfig | undefined => {
  const qualifiedTiers = AGENT_TIERS.filter(t => deposit >= t.minDeposit);
  return qualifiedTiers[qualifiedTiers.length - 1];
};

export const GAME_FEES = {
  wingo: 2.0,
  k3: 3.0,
  fived: 2.0,
  trxwin: 2.0,
  crash: 2.0,
  mines: 2.0,
  aviator: 2.0,
} as const;

export type GameType = keyof typeof GAME_FEES;

export const getGameFee = (gameType: string): number => {
  const normalizedType = gameType.toLowerCase().replace(/[^a-z0-9]/g, '');
  return GAME_FEES[normalizedType as GameType] || 2.0;
};

export const formatBDT = (amount: number): string => {
  if (amount >= 10000000) {
    return `৳${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `৳${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}K`;
  }
  return `৳${amount.toLocaleString('en-IN')}`;
};

export const formatBDTFull = (amount: number): string => {
  return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const REGISTRATION_BONUS = {
  userAmount: 50,
  agentAmount: 30,
};

export const AGENT_STATUS_CONFIG = {
  none: { label: 'Not Applied', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  pending: { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20' },
  frozen: { label: 'Frozen', color: 'text-blue-400', bg: 'bg-blue-500/20' },
};
