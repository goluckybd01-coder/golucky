import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Clock, Star, Crown, Medal, 
  Gamepad2, Coins, ChevronRight, Sparkles, Timer, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchTournaments, 
  getParticipantCount, 
  getRemainingTime,
  getGameDisplayName,
  parsePrizeDistribution,
  Tournament 
} from "@/lib/tournamentService";
import { useLanguage } from "@/hooks/useLanguage";

export default function Tournaments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isBangla = language === 'bn';
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadTournaments();
  }, [activeTab]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await fetchTournaments(activeTab === 'all' ? undefined : activeTab);
      setTournaments(data);

      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (t) => {
          counts[t.id] = await getParticipantCount(t.id);
        })
      );
      setParticipantCounts(counts);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "টুর্নামেন্ট লোড করতে ব্যর্থ" : "Failed to load tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30"
    };
    
    const labels: Record<string, { en: string; bn: string }> = {
      active: { en: "LIVE", bn: "লাইভ" },
      upcoming: { en: "Upcoming", bn: "আসন্ন" },
      completed: { en: "Completed", bn: "সম্পন্ন" },
      cancelled: { en: "Cancelled", bn: "বাতিল" }
    };

    return (
      <Badge className={`${styles[status]} font-semibold`}>
        {status === 'active' && <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />}
        {labels[status]?.[isBangla ? 'bn' : 'en'] || status}
      </Badge>
    );
  };

  const getTournamentTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      daily: "bg-purple-500/20 text-purple-400",
      weekly: "bg-orange-500/20 text-orange-400",
      special: "bg-yellow-500/20 text-yellow-400"
    };
    
    const labels: Record<string, { en: string; bn: string }> = {
      daily: { en: "Daily", bn: "দৈনিক" },
      weekly: { en: "Weekly", bn: "সাপ্তাহিক" },
      special: { en: "Special", bn: "বিশেষ" }
    };

    return (
      <Badge className={styles[type]}>
        {labels[type]?.[isBangla ? 'bn' : 'en'] || type}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">{isBangla ? "টুর্নামেন্ট" : "Tournaments"}</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-full mb-3"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              {isBangla ? "প্রতিযোগিতায় অংশ নিন" : "Compete & Win"}
            </span>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isBangla ? "টুর্নামেন্ট হাব" : "Tournament Hub"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isBangla 
              ? "অন্যান্য খেলোয়াড়দের সাথে প্রতিযোগিতা করুন এবং বড় পুরস্কার জিতুন!"
              : "Compete with other players and win big prizes!"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full bg-card/50">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary">
              <Sparkles className="w-4 h-4 mr-1" />
              {isBangla ? "লাইভ" : "Live"}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary">
              <Clock className="w-4 h-4 mr-1" />
              {isBangla ? "আসন্ন" : "Upcoming"}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary">
              <Medal className="w-4 h-4 mr-1" />
              {isBangla ? "সম্পন্ন" : "Completed"}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card/50 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-24 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isBangla ? "কোন টুর্নামেন্ট পাওয়া যায়নি" : "No tournaments found"}
                </p>
              </motion.div>
            ) : (
              tournaments.map((tournament, index) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  participantCount={participantCounts[tournament.id] || 0}
                  index={index}
                  isBangla={isBangla}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function TournamentCard({ tournament, participantCount, index, isBangla, onClick }: { 
  tournament: Tournament; participantCount: number; index: number; isBangla: boolean; onClick: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(tournament.end_time));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getRemainingTime(tournament.end_time)), 1000);
    return () => clearInterval(timer);
  }, [tournament.end_time]);
  const fillPercent = Math.min((participantCount / tournament.max_participants) * 100, 100);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card className="bg-gradient-to-br from-card/80 to-card/40 border-primary/20 hover:border-primary/40 transition-all cursor-pointer overflow-hidden" onClick={onClick}>
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-primary/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{isBangla ? tournament.name_bn || tournament.name : tournament.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Gamepad2 className="w-3 h-3 mr-1" />
                      {getGameDisplayName(tournament.game_type, isBangla)}
                    </Badge>
                    {getTournamentTypeBadge(tournament.tournament_type)}
                  </div>
                </div>
              </div>
              {getStatusBadge(tournament.status)}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-muted-foreground">{isBangla ? "পুরস্কার পুল" : "Prize Pool"}</span>
              </div>
              <span className="text-xl font-bold text-yellow-400">৳{tournament.prize_pool.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{isBangla ? "অংশগ্রহণকারী" : "Players"}</p>
                <p className="font-semibold text-sm">{participantCount}/{tournament.max_participants}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{isBangla ? "এন্ট্রি ফি" : "Entry Fee"}</p>
                <p className="font-semibold text-sm">{tournament.entry_fee > 0 ? `৳${tournament.entry_fee}` : (isBangla ? "ফ্রি" : "FREE")}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Crown className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{isBangla ? "১ম পুরস্কার" : "1st Prize"}</p>
                <p className="font-semibold text-sm text-orange-400">{parsePrizeDistribution(tournament.prize_distribution)[0]?.percent || 50}%</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{isBangla ? "স্লট পূর্ণ হয়েছে" : "Slots Filled"}</span>
                <span>{fillPercent.toFixed(0)}%</span>
              </div>
              <Progress value={fillPercent} className="h-2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-primary" />
                {timeLeft.expired ? (
                  <span className="text-muted-foreground">{isBangla ? "সময় শেষ" : "Ended"}</span>
                ) : (
                  <span className="font-mono">
                    {timeLeft.days > 0 && `${timeLeft.days}d `}
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                )}
              </div>
              <Button size="sm" className="gap-1">{isBangla ? "বিস্তারিত দেখুন" : "View Details"}<ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getTournamentTypeBadge(type: string) {
  const styles: Record<string, string> = { daily: "bg-purple-500/20 text-purple-400", weekly: "bg-orange-500/20 text-orange-400", special: "bg-yellow-500/20 text-yellow-400" };
  return <Badge className={styles[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  return (
    <Badge className={`${styles[status]} font-semibold`}>
      {status === 'active' && <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />}
      {status.toUpperCase()}
    </Badge>
  );
}
