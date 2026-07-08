// Referral system using localStorage (UI demo)
const REFERRAL_CODE_KEY = "golucky_referral_code";
const REFERRAL_STATS_KEY = "golucky_referral_stats";
const REFERRAL_BALANCE_KEY = "golucky_referral_balance";

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  referredUsers: Array<{
    phone: string;
    date: string;
    bonus: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  earnings: number;
  isCurrentUser?: boolean;
}

// Reward amounts
export const REFERRER_BONUS = 50; // ৳50 for the referrer
export const NEW_USER_BONUS = 25; // ৳25 for the new user

// Mock leaderboard data (in a real app, this would come from a backend)
const MOCK_LEADERBOARD: Omit<LeaderboardEntry, "isCurrentUser">[] = [
  { rank: 1, username: "Lucky★Star", referrals: 156, earnings: 7800 },
  { rank: 2, username: "GoldMiner88", referrals: 142, earnings: 7100 },
  { rank: 3, username: "WinMaster", referrals: 128, earnings: 6400 },
  { rank: 4, username: "Fortune77", referrals: 115, earnings: 5750 },
  { rank: 5, username: "RichKing99", referrals: 103, earnings: 5150 },
  { rank: 6, username: "Diamond_Pro", referrals: 95, earnings: 4750 },
  { rank: 7, username: "MoneyMaker", referrals: 87, earnings: 4350 },
  { rank: 8, username: "BDChamp", referrals: 79, earnings: 3950 },
  { rank: 9, username: "TopPlayer1", referrals: 72, earnings: 3600 },
  { rank: 10, username: "ProGamer_BD", referrals: 65, earnings: 3250 },
];

// Get leaderboard with current user's position
export const getLeaderboard = (): LeaderboardEntry[] => {
  const stats = getReferralStats();
  const userReferrals = stats.totalReferrals;
  
  // Find where current user would rank
  let userRank = MOCK_LEADERBOARD.length + 1;
  for (let i = 0; i < MOCK_LEADERBOARD.length; i++) {
    if (userReferrals >= MOCK_LEADERBOARD[i].referrals) {
      userRank = i + 1;
      break;
    }
  }
  
  // Create leaderboard with current user
  const leaderboard: LeaderboardEntry[] = MOCK_LEADERBOARD.map((entry, index) => ({
    ...entry,
    rank: index >= userRank - 1 ? index + 2 : index + 1,
  }));
  
  // Insert current user if they have referrals
  if (userReferrals > 0) {
    leaderboard.splice(userRank - 1, 0, {
      rank: userRank,
      username: "You",
      referrals: userReferrals,
      earnings: stats.totalEarnings,
      isCurrentUser: true,
    });
    // Keep only top 10
    leaderboard.splice(10);
  }
  
  return leaderboard.slice(0, 10);
};

// Get current user's rank
export const getUserRank = (): number => {
  const stats = getReferralStats();
  if (stats.totalReferrals === 0) return 0;
  
  let rank = 1;
  for (const entry of MOCK_LEADERBOARD) {
    if (stats.totalReferrals < entry.referrals) {
      rank++;
    } else {
      break;
    }
  }
  return rank;
};

// Generate a unique 6-character referral code
const generateReferralCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get or create the user's referral code
export const getReferralCode = (): string => {
  let code = localStorage.getItem(REFERRAL_CODE_KEY);
  if (!code) {
    code = generateReferralCode();
    localStorage.setItem(REFERRAL_CODE_KEY, code);
  }
  return code;
};

// Get referral stats
export const getReferralStats = (): ReferralStats => {
  const code = getReferralCode();
  const statsStr = localStorage.getItem(REFERRAL_STATS_KEY);
  
  if (statsStr) {
    return JSON.parse(statsStr);
  }
  
  return {
    referralCode: code,
    totalReferrals: 0,
    totalEarnings: 0,
    referredUsers: [],
  };
};

// Get referral balance
export const getReferralBalance = (): number => {
  const balance = localStorage.getItem(REFERRAL_BALANCE_KEY);
  return balance ? parseFloat(balance) : 0;
};

// Add referral balance
export const addReferralBalance = (amount: number): void => {
  const current = getReferralBalance();
  localStorage.setItem(REFERRAL_BALANCE_KEY, (current + amount).toString());
};

// Check if an invitation code is valid (for demo, any 6-char code is valid)
export const isValidReferralCode = (code: string): boolean => {
  if (!code || code.length !== 6) return false;
  return /^[A-Z0-9]{6}$/.test(code);
};

// Process a signup with referral code
export const processReferralSignup = (
  referralCode: string,
  newUserPhone: string
): { referrerBonus: number; newUserBonus: number } | null => {
  if (!isValidReferralCode(referralCode)) {
    return null;
  }
  
  // Add bonus for the new user
  addReferralBalance(NEW_USER_BONUS);
  
  // In a real app, we'd look up the referrer and credit them
  // For demo, we'll just show the stats if the code matches our own
  const myCode = getReferralCode();
  
  if (referralCode === myCode) {
    // User can't refer themselves
    return null;
  }
  
  // Store that a referral happened (simulate referrer getting credit)
  const stats = getReferralStats();
  stats.totalReferrals += 1;
  stats.totalEarnings += REFERRER_BONUS;
  stats.referredUsers.push({
    phone: newUserPhone.slice(0, 4) + "****" + newUserPhone.slice(-2),
    date: new Date().toISOString().split("T")[0],
    bonus: REFERRER_BONUS,
  });
  
  localStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(stats));
  addReferralBalance(REFERRER_BONUS);
  
  return {
    referrerBonus: REFERRER_BONUS,
    newUserBonus: NEW_USER_BONUS,
  };
};

// Simulate receiving a referral bonus (for demo purposes)
export const simulateIncomingReferral = (): void => {
  const stats = getReferralStats();
  const mockPhone = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  
  stats.totalReferrals += 1;
  stats.totalEarnings += REFERRER_BONUS;
  stats.referredUsers.push({
    phone: mockPhone.slice(0, 4) + "****" + mockPhone.slice(-2),
    date: new Date().toISOString().split("T")[0],
    bonus: REFERRER_BONUS,
  });
  
  localStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(stats));
  addReferralBalance(REFERRER_BONUS);
};

// Copy referral code to clipboard
export const copyReferralCode = async (): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(getReferralCode());
    return true;
  } catch {
    return false;
  }
};

// Get shareable referral link
export const getReferralLink = (): string => {
  const code = getReferralCode();
  return `${window.location.origin}/register?ref=${code}`;
};
