import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Trophy, Users, Clock, Star, Crown, Medal, 
  Gamepad2, Coins, ArrowLeft, Sparkles, Timer,
  Target, Award, TrendingUp, User, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchTournament, 
  fetchTournamentLeaderboard,
  checkParticipation,
  joinTournament,
  getParticipantCount,
  getRemainingTime,
  getGameDisplayName,
  parsePrizeDistribution,
  Tournament,
  LeaderboardEntry
} from "@/lib/tournamentService";
import { useLanguage } from "@/hooks/useLanguage";

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isBangla = language === 'bn';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (id) loadTournamentData();
  }, [id, userId]);

  useEffect(() => {
    if (tournament) {
      const timer = setInterval(() => {
        setTimeLeft(getRemainingTime(tournament.end_time));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tournament]);

  const loadTournamentData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [tournamentData, leaderboardData, count] = await Promise.all([
        fetchTournament(id),
        fetchTournamentLeaderboard(id),
        getParticipantCount(id)
      ]);

      setTournament(tournamentData);
      setLeaderboard(leaderboardData);
      setParticipantCount(count);

      if (userId) {
        const participation = await checkParticipation(id, userId);
        setIsParticipating(!!participation);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "টুর্নামেন্ট লোড করতে ব্যর্থ" : "Failed to load tournament",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userId) {
      toast({
        title: isBangla ? "লগইন প্রয়োজন" : "Login Required",
        description: isBangla ? "টুর্নামেন্টে যোগ দিতে লগইন করুন" : "Please login to join the tournament",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!tournament || !id) return;

    try {
      setJoining(true);
      await joinTournament(id, userId);
      setIsParticipating(true);
      setParticipantCount(prev => prev + 1);
      
      toast({
        title: isBangla ? "সফল!" : "Success!",
        description: isBangla 
          ? "টুর্নামেন্টে সফলভাবে যোগ দিয়েছেন!"
          : "Successfully joined the tournament!",
      });
    } catch (error: any) {
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: error.message || (isBangla ? "যোগ দিতে ব্যর্থ" : "Failed to join"),
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const goToGame = () => {
    if (!tournament) return;
    const routes: Record<string, string> = {
      wingo: '/games/wingo',
      k3: '/games/k3',
      '5d': '/games/5d',
      trxwin: '/games/trxwin',
      crash: '/games/crash',
      mines: '/games/mines',
      aviator: '/games/aviator'
    };
    navigate(routes[tournament.game_type] || '/home');
  };

  const prizeDistribution = parsePrizeDistribution(tournament?.prize_distribution);

  if (loading || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const fillPercent = Math.min((participantCount / tournament.max_participants) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">
            {isBangla ? tournament.name_bn || tournament.name : tournament.name}
          </h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tournaments')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isBangla ? "ফিরে যান" : "Back"}
        </Button>

        {/* Header Card */}
        <Card className="bg-gradient-to-br from-primary/20 via-card to-card border-primary/20 mb-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {isBangla ? tournament.name_bn || tournament.name : tournament.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      <Gamepad2 className="w-3 h-3 mr-1" />
                      {getGameDisplayName(tournament.game_type, isBangla)}
                    </Badge>
                    <Badge className={
                      tournament.status === 'active' 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-blue-500/20 text-blue-400"
                    }>
                      {tournament.status === 'active' && (
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                      )}
                      {tournament.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Pool */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <span className="text-muted-foreground">
                    {isBangla ? "মোট পুরস্কার পুল" : "Total Prize Pool"}
                  </span>
                </div>
                <span className="text-3xl font-bold text-yellow-400">
                  ৳{tournament.prize_pool.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: isBangla ? 'দিন' : 'Days', value: timeLeft.days },
                { label: isBangla ? 'ঘন্টা' : 'Hours', value: timeLeft.hours },
                { label: isBangla ? 'মিনিট' : 'Mins', value: timeLeft.minutes },
                { label: isBangla ? 'সেকেন্ড' : 'Secs', value: timeLeft.seconds }
              ].map((item, i) => (
                <div key={i} className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono">{String(item.value).padStart(2, '0')}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="font-bold">{participantCount}/{tournament.max_participants}</p>
                <p className="text-xs text-muted-foreground">
                  {isBangla ? "অংশগ্রহণকারী" : "Players"}
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="font-bold">
                  {tournament.entry_fee > 0 ? `৳${tournament.entry_fee}` : (isBangla ? "ফ্রি" : "FREE")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBangla ? "এন্ট্রি ফি" : "Entry Fee"}
                </p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <Crown className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="font-bold text-orange-400">
                  ৳{Math.floor(tournament.prize_pool * (prizeDistribution[0]?.percent || 50) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBangla ? "১ম পুরস্কার" : "1st Prize"}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{isBangla ? "স্লট পূর্ণ হয়েছে" : "Slots Filled"}</span>
                <span>{fillPercent.toFixed(0)}%</span>
              </div>
              <Progress value={fillPercent} className="h-2" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isParticipating ? (
                <>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    {isBangla ? "অংশগ্রহণ করছেন" : "Participating"}
                  </Button>
                  <Button onClick={goToGame} className="flex-1">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    {isBangla ? "খেলুন" : "Play Now"}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  disabled={joining || tournament.status !== 'active'}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {joining ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Trophy className="w-4 h-4 mr-2" />
                  )}
                  {tournament.entry_fee > 0 
                    ? (isBangla ? `৳${tournament.entry_fee} দিয়ে যোগ দিন` : `Join for ৳${tournament.entry_fee}`)
                    : (isBangla ? "বিনামূল্যে যোগ দিন" : "Join Free")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="mb-6">
          <TabsList className="grid grid-cols-3 w-full bg-card/50">
            <TabsTrigger value="leaderboard">
              <Medal className="w-4 h-4 mr-1" />
              {isBangla ? "লিডারবোর্ড" : "Leaderboard"}
            </TabsTrigger>
            <TabsTrigger value="prizes">
              <Award className="w-4 h-4 mr-1" />
              {isBangla ? "পুরস্কার" : "Prizes"}
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Target className="w-4 h-4 mr-1" />
              {isBangla ? "নিয়ম" : "Rules"}
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {isBangla ? "শীর্ষ খেলোয়াড়" : "Top Players"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>{isBangla ? "এখনও কোন অংশগ্রহণকারী নেই" : "No participants yet"}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => (
                        <LeaderboardRow 
                          key={entry.id} 
                          entry={entry} 
                          rank={index + 1}
                          isCurrentUser={entry.user_id === userId}
                          isBangla={isBangla}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prizes Tab */}
          <TabsContent value="prizes" className="mt-4">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  {isBangla ? "পুরস্কার বিতরণ" : "Prize Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prizeDistribution.map((prize, index) => {
                    const prizeAmount = Math.floor(tournament.prize_pool * prize.percent / 100);
                    const icons = [Crown, Medal, Star];
                    const colors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];
                    const Icon = icons[index] || Star;
                    const color = colors[index] || 'text-primary';
                    
                    return (
                      <div 
                        key={prize.rank}
                        className="flex items-center justify-between bg-background/50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-background flex items-center justify-center ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {isBangla ? `${prize.rank}ম স্থান` : `${prize.rank}${['st', 'nd', 'rd'][prize.rank - 1] || 'th'} Place`}
                            </p>
                            <p className="text-sm text-muted-foreground">{prize.percent}%</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-yellow-400">
                          ৳{prizeAmount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-4">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {isBangla ? "টুর্নামেন্ট নিয়ম" : "Tournament Rules"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <p className="text-muted-foreground">
                      {isBangla 
                        ? `${getGameDisplayName(tournament.game_type, true)} গেমে খেলুন এবং পয়েন্ট অর্জন করুন`
                        : `Play ${getGameDisplayName(tournament.game_type)} games to earn points`}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <p className="text-muted-foreground">
                      {isBangla 
                        ? "আপনার স্কোর = নেট লাভ + (খেলার সংখ্যা × 0.1) + (সেরা জয় × 0.5)"
                        : "Your Score = Net Profit + (Games Played × 0.1) + (Best Win × 0.5)"}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <p className="text-muted-foreground">
                      {isBangla 
                        ? "টুর্নামেন্ট শেষে সর্বোচ্চ স্কোরধারীরা পুরস্কার পাবেন"
                        : "Top scorers at the end win the prizes"}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">4</span>
                    </div>
                    <p className="text-muted-foreground">
                      {isBangla 
                        ? `ন্যূনতম ${tournament.min_participants} জন অংশগ্রহণকারী প্রয়োজন`
                        : `Minimum ${tournament.min_participants} participants required`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}

function LeaderboardRow({ 
  entry, 
  rank, 
  isCurrentUser,
  isBangla 
}: { 
  entry: LeaderboardEntry; 
  rank: number;
  isCurrentUser: boolean;
  isBangla: boolean;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-lg ${
        isCurrentUser 
          ? 'bg-primary/20 border border-primary/30' 
          : 'bg-background/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          {getRankIcon()}
        </div>
        <Avatar className="w-10 h-10 border-2 border-background">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback>
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">
            {entry.username || (isBangla ? "অজানা" : "Unknown")}
            {isCurrentUser && (
              <Badge className="ml-2 text-xs bg-primary/20 text-primary">
                {isBangla ? "আপনি" : "You"}
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.games_played} {isBangla ? "খেলা" : "games"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">{entry.score.toFixed(0)}</p>
        <p className="text-xs text-muted-foreground">
          {entry.net_profit >= 0 ? '+' : ''}৳{entry.net_profit.toFixed(0)}
        </p>
      </div>
    </motion.div>
  );
}
