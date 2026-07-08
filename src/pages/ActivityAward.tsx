import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, ChevronLeft, Gift, Star, Zap, Crown,
  Calendar, Target, Medal, Flame, CheckCircle2, Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DailyTask {
  id: string;
  name: string;
  reward: number;
  icon: React.ReactNode;
  checkCompletion: (stats: UserStats) => boolean;
}

interface UserStats {
  todayBets: number;
  todayWins: number;
  hasDeposited: boolean;
  hasLoggedIn: boolean;
}

interface AwardTier {
  id: string;
  name: string;
  icon: React.ReactNode;
  requirement: string;
  requiredBets: number;
  reward: number;
}

const ActivityAward = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedTasks, setClaimedTasks] = useState<Set<string>>(new Set());
  const [claimedMilestones, setClaimedMilestones] = useState<Set<string>>(new Set());
  const [userStats, setUserStats] = useState<UserStats>({
    todayBets: 0,
    todayWins: 0,
    hasDeposited: false,
    hasLoggedIn: true,
  });
  const [totalBets, setTotalBets] = useState(0);
  const [totalRewardsEarned, setTotalRewardsEarned] = useState(0);
  const [streakDay, setStreakDay] = useState(1);

  const dailyTasks: DailyTask[] = [
    { id: "login", name: "Daily Login", reward: 5, icon: <Calendar size={20} />, checkCompletion: (stats) => stats.hasLoggedIn },
    { id: "bet5", name: "Place 5 Bets", reward: 10, icon: <Target size={20} />, checkCompletion: (stats) => stats.todayBets >= 5 },
    { id: "win3", name: "Win 3 Games", reward: 15, icon: <Trophy size={20} />, checkCompletion: (stats) => stats.todayWins >= 3 },
    { id: "deposit", name: "Make a Deposit", reward: 20, icon: <Zap size={20} />, checkCompletion: (stats) => stats.hasDeposited },
  ];

  const awardTiers: AwardTier[] = [
    { id: "bronze", name: "Bronze Achievement", icon: <Medal className="text-amber-600" size={28} />, requirement: "Complete 10 bets", requiredBets: 10, reward: 50 },
    { id: "silver", name: "Silver Achievement", icon: <Medal className="text-gray-400" size={28} />, requirement: "Complete 50 bets", requiredBets: 50, reward: 200 },
    { id: "gold", name: "Gold Achievement", icon: <Medal className="text-yellow-500" size={28} />, requirement: "Complete 100 bets", requiredBets: 100, reward: 500 },
    { id: "platinum", name: "Platinum Achievement", icon: <Crown className="text-purple-500" size={28} />, requirement: "Complete 500 bets", requiredBets: 500, reward: 2000 },
  ];

  const weeklyMilestones = [
    { day: "Mon", dayNum: 1, reward: 10 },
    { day: "Tue", dayNum: 2, reward: 15 },
    { day: "Wed", dayNum: 3, reward: 20 },
    { day: "Thu", dayNum: 4, reward: 25 },
    { day: "Fri", dayNum: 5, reward: 30 },
    { day: "Sat", dayNum: 6, reward: 40 },
    { day: "Sun", dayNum: 0, reward: 100 },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: claims } = await supabase
        .from('activity_task_claims')
        .select('task_id, task_type, reward_amount')
        .eq('user_id', user.id)
        .eq('claim_date', today);

      if (claims) {
        const claimedSet = new Set(claims.filter(c => c.task_type === 'daily').map(c => c.task_id));
        setClaimedTasks(claimedSet);
        
        const milestoneSet = new Set(claims.filter(c => c.task_type === 'weekly').map(c => c.task_id));
        setClaimedMilestones(milestoneSet);
      }

      const { data: allClaims } = await supabase
        .from('activity_task_claims')
        .select('reward_amount')
        .eq('user_id', user.id);

      if (allClaims) {
        const total = allClaims.reduce((sum, c) => sum + Number(c.reward_amount), 0);
        setTotalRewardsEarned(total);
      }

      const { data: todayBets } = await supabase
        .from('game_bets')
        .select('id, result')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`);

      const { count: totalBetCount } = await supabase
        .from('game_bets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalBets(totalBetCount || 0);

      const { data: todayDeposits } = await supabase
        .from('transaction_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'deposit')
        .eq('status', 'approved')
        .gte('created_at', `${today}T00:00:00`);

      const { data: loginRewards } = await supabase
        .from('daily_login_rewards')
        .select('streak_day')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (loginRewards && loginRewards.length > 0) {
        setStreakDay(loginRewards[0].streak_day);
      }

      setUserStats({
        todayBets: todayBets?.length || 0,
        todayWins: todayBets?.filter(b => b.result === 'win').length || 0,
        hasDeposited: (todayDeposits?.length || 0) > 0,
        hasLoggedIn: true,
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (taskId: string, reward: number, taskType: 'daily' | 'weekly' | 'achievement') => {
    setClaiming(taskId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to claim rewards');
        return;
      }

      const { error: claimError } = await supabase
        .from('activity_task_claims')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_type: taskType,
          reward_amount: reward,
        });

      if (claimError) {
        if (claimError.code === '23505') {
          toast.error('Already claimed this reward!');
        } else {
          throw claimError;
        }
        return;
      }

      const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
        p_user_id: user.id,
        p_amount: reward,
        p_reward_type: "activity_reward",
        p_reason: `Activity Reward: ${taskId}`,
      });

      const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || "Failed to credit reward");
      }

      if (taskType === 'daily') {
        setClaimedTasks(prev => new Set([...prev, taskId]));
      } else if (taskType === 'weekly') {
        setClaimedMilestones(prev => new Set([...prev, taskId]));
      }
      
      setTotalRewardsEarned(prev => prev + reward);
      toast.success(`Claimed ৳${reward} reward!`);

    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentDay = new Date().getDay();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 pt-6 pb-8 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Activity Award</h1>
            <p className="text-white/80 text-sm">Complete tasks to earn rewards</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Trophy className="text-white" size={28} />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Rewards Earned</p>
                <p className="text-2xl font-bold text-gray-800">৳{totalRewardsEarned.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Login Streak</p>
              <p className="text-xl font-bold text-amber-600">{streakDay} days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Flame className="text-orange-500" size={20} />
              Daily Tasks
            </h2>
            <span className="text-xs text-gray-500">Resets in {getTimeUntilReset()}</span>
          </div>
          
          <div className="space-y-3">
            {dailyTasks.map((task) => {
              const isCompleted = task.checkCompletion(userStats);
              const isClaimed = claimedTasks.has(task.id);
              const canClaim = isCompleted && !isClaimed;
              
              return (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isClaimed 
                      ? "bg-green-50 border-green-200" 
                      : isCompleted
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isClaimed ? "bg-green-500 text-white" : isCompleted ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {isClaimed ? <CheckCircle2 size={20} /> : task.icon}
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${isClaimed ? "text-green-700" : isCompleted ? "text-amber-700" : "text-gray-700"}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">৳{task.reward}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => canClaim && claimTask(task.id, task.reward, 'daily')}
                    disabled={!canClaim || claiming === task.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isClaimed 
                        ? "bg-green-500 text-white cursor-default" 
                        : canClaim
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 active:scale-95"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {claiming === task.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : isClaimed ? (
                      "Claimed"
                    ) : canClaim ? (
                      "Claim"
                    ) : (
                      "Incomplete"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Calendar className="text-blue-500" size={20} />
            Weekly Milestones
          </h2>
          
          <div className="flex justify-between">
            {weeklyMilestones.map((day) => {
              const isToday = day.dayNum === currentDay;
              const isPast = (currentDay === 0 ? 7 : currentDay) > (day.dayNum === 0 ? 7 : day.dayNum);
              const isClaimed = claimedMilestones.has(`weekly_${day.day}`);
              const canClaim = isToday && !isClaimed;
              
              return (
                <button
                  key={day.day}
                  onClick={() => canClaim && claimTask(`weekly_${day.day}`, day.reward, 'weekly')}
                  disabled={!canClaim || claiming === `weekly_${day.day}`}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                      isClaimed 
                        ? "bg-green-500" 
                        : isToday 
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-orange-300 hover:scale-110" 
                          : day.dayNum === 0 
                            ? "bg-gradient-to-br from-purple-400 to-pink-500" 
                            : isPast
                              ? "bg-gray-300"
                              : "bg-gray-200"
                    }`}
                  >
                    {claiming === `weekly_${day.day}` ? (
                      <Loader2 className="animate-spin text-white" size={16} />
                    ) : isClaimed ? (
                      <CheckCircle2 className="text-white" size={20} />
                    ) : day.dayNum === 0 ? (
                      <Star className="text-white" size={18} />
                    ) : (
                      <Gift className={isToday ? "text-white" : "text-gray-400"} size={18} />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? "text-orange-600" : "text-gray-500"}`}>
                    {day.day}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    day.dayNum === 0 ? "text-purple-600" : "text-amber-600"
                  }`}>
                    ৳{day.reward}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-6">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Star className="text-yellow-500" size={20} />
          Achievement Tiers
        </h2>
        
        <div className="space-y-3">
          {awardTiers.map((tier) => {
            const progress = Math.min((totalBets / tier.requiredBets) * 100, 100);
            const isCompleted = totalBets >= tier.requiredBets;
            const isClaimed = claimedTasks.has(`achievement_${tier.id}`);
            const canClaim = isCompleted && !isClaimed;
            
            return (
              <div 
                key={tier.id}
                className="bg-white rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{tier.name}</h3>
                    <p className="text-xs text-gray-500">{tier.requirement}</p>
                  </div>
                  <div className="text-right">
                    {canClaim ? (
                      <button
                        onClick={() => claimTask(`achievement_${tier.id}`, tier.reward, 'achievement')}
                        disabled={claiming === `achievement_${tier.id}`}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95"
                      >
                        {claiming === `achievement_${tier.id}` ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          `Claim ৳${tier.reward}`
                        )}
                      </button>
                    ) : isClaimed ? (
                      <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Claimed
                      </span>
                    ) : (
                      <p className="text-lg font-bold text-amber-600">৳{tier.reward}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progress: {totalBets}/{tier.requiredBets} bets</span>
                    <span className="text-amber-600 font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityAward;
