import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, ChevronLeft, Copy, Share2, Gift, TrendingUp,
  UserPlus, Coins, Crown, CheckCircle2, ArrowRight, MessageCircle, Loader2, Trophy, Medal
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek } from "date-fns";

interface ReferralLevel {
  level: number;
  commission: string;
  description: string;
  totalReferrals: number;
  totalCommission: number;
}

interface ReferredUser {
  id: string;
  name: string;
  avatar: string;
  joinDate: string;
  totalBet: number;
  commission: number;
  status: "active" | "inactive";
  level: number;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  totalDeposit: number;
  totalBet: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  weeklyCommission: number;
  totalReferrals: number;
  isCurrentUser: boolean;
}

const AVATAR_EMOJIS = ["🎮", "🎲", "🎯", "🎰", "💎", "🚀", "⭐", "🎪", "🎨", "🎭"];
const RANK_COLORS = ["from-yellow-400 to-amber-500", "from-gray-300 to-gray-400", "from-amber-600 to-orange-700"];
const RANK_ICONS = [<Trophy key="1" className="text-yellow-400" size={16} />, <Medal key="2" className="text-gray-400" size={16} />, <Medal key="3" className="text-amber-700" size={16} />];

const InvitationBonus = () => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("LOADING...");
  const [referralLink, setReferralLink] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "referrals">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    totalDeposit: 0,
    totalBet: 0,
  });

  const [levels, setLevels] = useState<ReferralLevel[]>([
    { level: 1, commission: "0.6%", description: "Direct referrals", totalReferrals: 0, totalCommission: 0 },
    { level: 2, commission: "0.18%", description: "2nd level referrals", totalReferrals: 0, totalCommission: 0 },
    { level: 3, commission: "0.054%", description: "3rd level referrals", totalReferrals: 0, totalCommission: 0 },
  ]);

  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maskName = (name: string | null): string => {
    if (!name) return "User***";
    if (name.length <= 3) return `${name}***`;
    return `${name.substring(0, 3)}***${name.slice(-2)}`;
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code, id")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
        setReferralLink(`${window.location.origin}/register?ref=${profile.referral_code}`);
      }

      const { data: statsData } = await supabase
        .rpc("get_referral_stats", { p_user_id: user.id });

      if (statsData && statsData.length > 0) {
        let totalRefs = 0;
        let totalComm = 0;
        let totalDep = 0;
        let totalBetAmount = 0;

        const updatedLevels = levels.map((lvl) => {
          const levelStats = statsData.find((s: any) => s.level === lvl.level);
          if (levelStats) {
            totalRefs += Number(levelStats.total_referrals) || 0;
            totalComm += Number(levelStats.total_commission) || 0;
            totalDep += Number(levelStats.total_deposit) || 0;
            totalBetAmount += Number(levelStats.total_bet) || 0;
            return {
              ...lvl,
              totalReferrals: Number(levelStats.total_referrals) || 0,
              totalCommission: Number(levelStats.total_commission) || 0,
            };
          }
          return lvl;
        });

        setLevels(updatedLevels);
        setStats({
          totalReferrals: totalRefs,
          activeReferrals: statsData.reduce((acc: number, s: any) => acc + (Number(s.deposited_count) || 0), 0),
          totalCommission: totalComm,
          pendingCommission: 0,
          totalDeposit: totalDep,
          totalBet: totalBetAmount,
        });
      }

      if (profile?.id) {
        const { data: referrals } = await supabase
          .from("referral_tree")
          .select("referred_user_id, referred_profile_id, level, referred_at")
          .eq("referrer_profile_id", profile.id)
          .order("referred_at", { ascending: false })
          .limit(50);

        if (referrals && referrals.length > 0) {
          const userIds = referrals.map(r => r.referred_user_id).filter(Boolean);
          
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, username, created_at")
            .in("user_id", userIds);

          const { data: wallets } = await supabase
            .from("wallets")
            .select("user_id, total_bet, total_deposit")
            .in("user_id", userIds);

          const { data: commissions } = await supabase
            .from("referral_commissions")
            .select("referred_user_id, commission_amount")
            .eq("referrer_id", user.id);

          const commissionMap = new Map<string, number>();
          commissions?.forEach(c => {
            const existing = commissionMap.get(c.referred_user_id) || 0;
            commissionMap.set(c.referred_user_id, existing + Number(c.commission_amount));
          });

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
          const walletMap = new Map(wallets?.map(w => [w.user_id, w]));

          const users: ReferredUser[] = referrals.map((ref, index) => {
            const userProfile = profileMap.get(ref.referred_user_id!);
            const userWallet = walletMap.get(ref.referred_user_id!);
            const totalBet = Number(userWallet?.total_bet) || 0;
            const commission = commissionMap.get(ref.referred_user_id!) || 0;

            return {
              id: ref.referred_user_id || `user-${index}`,
              name: maskName(userProfile?.username || null),
              avatar: AVATAR_EMOJIS[index % AVATAR_EMOJIS.length],
              joinDate: ref.referred_at ? format(new Date(ref.referred_at), "yyyy-MM-dd") : "N/A",
              totalBet,
              commission,
              status: totalBet > 0 ? "active" : "inactive",
              level: ref.level || 1,
            };
          });

          setReferredUsers(users);
        }
      }

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data: weeklyCommissions } = await supabase
        .from("referral_commissions")
        .select("referrer_id, commission_amount, created_at")
        .gte("created_at", weekStart.toISOString());

      if (weeklyCommissions && weeklyCommissions.length > 0) {
        const commissionsByReferrer = new Map<string, number>();
        weeklyCommissions.forEach(c => {
          const existing = commissionsByReferrer.get(c.referrer_id) || 0;
          commissionsByReferrer.set(c.referrer_id, existing + Number(c.commission_amount));
        });

        const referrerIds = Array.from(commissionsByReferrer.keys());

        const { data: referrerProfiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", referrerIds);

        const referralCountMap = new Map<string, number>();
        for (const referrerId of referrerIds) {
          const { data: refProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", referrerId)
            .single();
          
          if (refProfile) {
            const { count } = await supabase
              .from("referral_tree")
              .select("*", { count: "exact", head: true })
              .eq("referrer_profile_id", refProfile.id);
            
            referralCountMap.set(referrerId, count || 0);
          }
        }

        const profileMap = new Map(referrerProfiles?.map(p => [p.user_id, p]));

        const entries: LeaderboardEntry[] = referrerIds
          .map((referrerId, index) => {
            const profile = profileMap.get(referrerId);
            return {
              rank: 0,
              userId: referrerId,
              username: maskName(profile?.username || null),
              avatar: AVATAR_EMOJIS[index % AVATAR_EMOJIS.length],
              weeklyCommission: commissionsByReferrer.get(referrerId) || 0,
              totalReferrals: referralCountMap.get(referrerId) || 0,
              isCurrentUser: referrerId === user.id,
            };
          })
          .sort((a, b) => b.weeklyCommission - a.weeklyCommission)
          .slice(0, 10)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        setLeaderboard(entries);

        const userEntry = entries.find(e => e.isCurrentUser);
        if (userEntry) {
          setCurrentUserRank(userEntry.rank);
        } else {
          const userCommission = commissionsByReferrer.get(user.id);
          if (userCommission) {
            const allEntries = referrerIds
              .map(id => ({ id, commission: commissionsByReferrer.get(id) || 0 }))
              .sort((a, b) => b.commission - a.commission);
            const rank = allEntries.findIndex(e => e.id === user.id) + 1;
            setCurrentUserRank(rank > 0 ? rank : null);
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const commissionsChannel = supabase
      .channel("referral-commissions-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "referral_commissions",
          filter: `referrer_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New commission received:", payload);
          toast.success("New commission earned! 🎉");
          fetchData();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const newProfile = payload.new as any;
          if (newProfile.referred_by) {
            console.log("New user registered:", payload);
            setTimeout(() => {
              fetchData();
              toast.success("New referral joined! 🎊");
            }, 1000);
          }
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel("game-bets-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_bets",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commissionsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [userId]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const shareMessage = `🎰 Join GoLucky and get ৳25 bonus on signup! Use my referral code: ${referralCode}\n\n🎁 Play exciting games and win big!\n\n👉 ${referralLink}`;

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const shareViaTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`🎰 Join GoLucky and get ৳25 bonus! Use code: ${referralCode}`)}`;
    window.open(url, "_blank");
    toast.success("Opening Telegram...");
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(`Join GoLucky with my referral code ${referralCode} and get ৳25 bonus!`)}`;
    window.open(url, "_blank");
    toast.success("Opening Facebook...");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join GoLucky",
          text: `🎰 Join GoLucky and get ৳25 bonus! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(referralLink, "Referral link");
        }
      }
    } else {
      copyToClipboard(referralLink, "Referral link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-50">
      <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 pt-6 pb-8 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Invitation Bonus</h1>
            <p className="text-white/80 text-sm">Invite friends & earn commission</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/95 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="text-blue-500" size={18} />
              <span className="text-gray-500 text-xs">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalReferrals}</p>
            <p className="text-xs text-emerald-600">{stats.activeReferrals} active</p>
          </div>
          <div className="bg-white/95 backdrop-blur rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="text-amber-500" size={18} />
              <span className="text-gray-500 text-xs">Total Commission</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalCommission)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Share2 className="text-blue-500" size={18} />
            Your Referral Code
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-lg text-blue-700">{referralCode}</span>
              <button 
                onClick={() => copyToClipboard(referralCode, "Referral code")}
                className="p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-colors"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">Referral Link</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate"
              />
              <button 
                onClick={() => copyToClipboard(referralLink, "Referral link")}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">Share via:</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={shareViaWhatsApp} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="text-[10px] font-medium">WhatsApp</span>
              </button>
              <button onClick={shareViaTelegram} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span className="text-[10px] font-medium">Telegram</span>
              </button>
              <button onClick={shareViaFacebook} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="text-[10px] font-medium">Facebook</span>
              </button>
              <button onClick={shareNative} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 text-white hover:opacity-90 transition-opacity">
                <Share2 className="w-6 h-6" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} />
            Commission Levels
          </h3>
          
          <div className="space-y-2">
            {levels.map((level) => (
              <div 
                key={level.level}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                  L{level.level}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{level.description}</p>
                  <p className="text-xs text-gray-500">{level.totalReferrals} referrals</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{level.commission}</p>
                  <p className="text-[10px] text-emerald-500">{formatCurrency(level.totalCommission)} earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Trophy className="text-yellow-300" size={18} />
            Weekly Top Referrers
            {currentUserRank && (
              <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">
                Your rank: #{currentUserRank}
              </span>
            )}
          </h3>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-6 text-white/70">
              <Trophy size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No rankings yet this week</p>
              <p className="text-xs">Be the first to earn commissions!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry) => (
                <div 
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    entry.isCurrentUser 
                      ? "bg-white/30 ring-2 ring-yellow-300" 
                      : "bg-white/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                    entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "from-gray-500 to-gray-600"
                  } flex items-center justify-center text-white font-bold text-sm`}>
                    {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : entry.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {entry.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">
                      {entry.username}
                      {entry.isCurrentUser && <span className="text-yellow-300 ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-white/70">{entry.totalReferrals} referrals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-300">{formatCurrency(entry.weeklyCommission)}</p>
                    <p className="text-[10px] text-white/60">this week</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview" 
                ? "bg-white text-blue-600 shadow" 
                : "text-gray-500"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("referrals")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "referrals" 
                ? "bg-white text-blue-600 shadow" 
                : "text-gray-500"
            }`}
          >
            My Referrals
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 pb-6">
        {activeTab === "overview" ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Gift className="text-pink-500" size={18} />
                How It Works
              </h3>
              
              <div className="space-y-3">
                {[
                  { step: 1, title: "Share your code", desc: "Send your referral code to friends" },
                  { step: 2, title: "Friend registers", desc: "They sign up using your code" },
                  { step: 3, title: "Friend plays", desc: "When they bet, you earn commission" },
                  { step: 4, title: "Get rewarded", desc: "Commission added to your wallet" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    {item.step < 4 && <ArrowRight className="text-gray-300" size={16} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Team Deposits</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalDeposit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Total Team Bets</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalBet)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {referredUsers.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No referrals yet</p>
                <p className="text-xs text-gray-400 mt-1">Share your code to invite friends!</p>
              </div>
            ) : (
              referredUsers.map((user) => (
                <div 
                  key={user.id}
                  className="bg-white rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-2xl relative">
                      {user.avatar}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                        L{user.level}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          user.status === "active" 
                            ? "bg-green-100 text-green-600" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Joined {user.joinDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Bet</p>
                      <p className="font-bold text-gray-800">{formatCurrency(user.totalBet)}</p>
                      <p className="text-xs text-emerald-600 font-medium">+{formatCurrency(user.commission)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationBonus;
