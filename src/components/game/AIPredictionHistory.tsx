import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, Trash2, ChevronDown, ChevronUp, Sparkles, Filter, Calendar, X, CheckCircle, XCircle, Target, TrendingUp, Download } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import { usePredictionAccuracy } from "@/hooks/usePredictionAccuracy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AIPrediction {
  title: string;
  description: string;
  numbers: number[];
  confidence: number;
  reasoning: string;
}

interface PredictionRecord {
  id: string;
  game_type: string;
  position: string | null;
  predictions: AIPrediction[];
  overall_insight: string | null;
  created_at: string;
  actual_result: number[] | null;
  accuracy_score: number | null;
  verified_at: string | null;
}

interface AIPredictionHistoryProps {
  gameType: string;
  position?: string;
}

type DateFilter = "today" | "7days" | "30days" | "all";
type GameFilter = "current" | "all";
type VerificationFilter = "all" | "verified" | "unverified";

export const AIPredictionHistory = ({ gameType, position }: AIPredictionHistoryProps) => {
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [stats, setStats] = useState<{
    totalVerified: number;
    avgAccuracy: number;
    highAccuracy: number;
    successRate: number;
  } | null>(null);
  
  const { verifyPrediction, getAccuracyStats } = usePredictionAccuracy();
  
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [gameFilter, setGameFilter] = useState<GameFilter>("current");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("ai_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (gameFilter === "current") {
        query = query.eq("game_type", gameType);
        if (position) {
          query = query.eq("position", position);
        }
      }

      const now = new Date();
      if (dateFilter === "today") {
        query = query.gte("created_at", startOfDay(now).toISOString());
      } else if (dateFilter === "7days") {
        query = query.gte("created_at", startOfDay(subDays(now, 7)).toISOString());
      } else if (dateFilter === "30days") {
        query = query.gte("created_at", startOfDay(subDays(now, 30)).toISOString());
      }

      if (verificationFilter === "verified") {
        query = query.not("verified_at", "is", null);
      } else if (verificationFilter === "unverified") {
        query = query.is("verified_at", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const parsed = (data || []).map(record => ({
        ...record,
        predictions: record.predictions as unknown as AIPrediction[],
        actual_result: record.actual_result as number[] | null,
        accuracy_score: record.accuracy_score as number | null,
        verified_at: record.verified_at as string | null,
      }));

      setHistory(parsed);
      
      const accuracyStats = await getAccuracyStats(gameFilter === "current" ? gameType : undefined);
      setStats(accuracyStats);
    } catch (err) {
      console.error("Failed to fetch prediction history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, gameType, position, dateFilter, gameFilter, verificationFilter]);

  const handleVerify = async (id: string) => {
    const numbers = verifyInput.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0) {
      toast.error("Enter valid numbers separated by commas");
      return;
    }
    
    const accuracy = await verifyPrediction(id, numbers);
    if (accuracy !== null) {
      toast.success(`Verified! Accuracy: ${accuracy}%`);
      setVerifyingId(null);
      setVerifyInput("");
      fetchHistory();
    } else {
      toast.error("Verification failed");
    }
  };

  const deletePrediction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_predictions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory(prev => prev.filter(p => p.id !== id));
      toast.success("Prediction deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "text-green-400";
    if (confidence >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  const getGameBadgeColor = (game: string) => {
    switch (game) {
      case "5D": return "bg-purple-500/20 text-purple-300";
      case "K3": return "bg-blue-500/20 text-blue-300";
      case "WinGo": return "bg-green-500/20 text-green-300";
      case "TrxWin": return "bg-orange-500/20 text-orange-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const clearFilters = () => {
    setDateFilter("all");
    setGameFilter("current");
    setVerificationFilter("all");
  };

  const hasActiveFilters = dateFilter !== "all" || gameFilter !== "current" || verificationFilter !== "all";

  const getAccuracyBadge = (score: number) => {
    if (score >= 70) return { bg: "bg-green-500", text: "Excellent" };
    if (score >= 50) return { bg: "bg-yellow-500", text: "Good" };
    if (score >= 30) return { bg: "bg-orange-500", text: "Fair" };
    return { bg: "bg-red-500", text: "Low" };
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows: string[][] = [];
    rows.push([
      "Date", "Game", "Position", "Prediction 1", "Confidence 1",
      "Prediction 2", "Confidence 2", "Prediction 3", "Confidence 3",
      "Actual Result", "Accuracy %", "Status", "Insight"
    ]);

    history.forEach(record => {
      const row: string[] = [
        format(new Date(record.created_at), "yyyy-MM-dd HH:mm"),
        record.game_type,
        record.position || "-",
      ];
      for (let i = 0; i < 3; i++) {
        const pred = record.predictions[i];
        if (pred) {
          row.push(pred.numbers.join(" "));
          row.push(String(pred.confidence));
        } else {
          row.push("-");
          row.push("-");
        }
      }
      row.push(record.actual_result ? record.actual_result.join(" ") : "-");
      row.push(record.accuracy_score !== null ? String(record.accuracy_score) : "-");
      row.push(record.verified_at ? "Verified" : "Pending");
      row.push(record.overall_insight ? `"${record.overall_insight.replace(/"/g, '""')}"` : "-");
      rows.push(row);
    });

    if (stats) {
      rows.push([]);
      rows.push(["=== SUMMARY STATS ==="]);
      rows.push(["Total Verified", String(stats.totalVerified)]);
      rows.push(["Average Accuracy", `${stats.avgAccuracy}%`]);
      rows.push(["High Accuracy (>50%)", String(stats.highAccuracy)]);
      rows.push(["Success Rate", `${stats.successRate}%`]);
    }

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ai-predictions-${gameType}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${history.length} predictions to CSV`);
  };

  if (!showHistory) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
        <History className="w-4 h-4" />
        View History
      </Button>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {stats && stats.totalVerified > 0 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Accuracy Stats
            </span>
            <span className="text-[10px] text-muted-foreground">{stats.totalVerified} verified</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{stats.avgAccuracy}%</div>
              <div className="text-[9px] text-muted-foreground">Avg Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">{stats.highAccuracy}</div>
              <div className="text-[9px] text-muted-foreground">High Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-500">{stats.successRate}%</div>
              <div className="text-[9px] text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          Prediction History
        </h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className={`h-7 px-2 ${hasActiveFilters ? "text-primary" : ""}`}>
            <Filter className="w-3 h-3 mr-1" />
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="h-7 px-2">Hide</Button>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Game</label>
              <Select value={gameFilter} onValueChange={(v) => setGameFilter(v as GameFilter)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">{gameType}</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Status</label>
              <Select value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as VerificationFilter)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-4">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-muted-foreground py-4 text-sm">
          No prediction history found
          {hasActiveFilters && <p className="text-xs mt-1">Try adjusting filters</p>}
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.map((record) => {
            const isAutoVerified = record.verified_at && (() => {
              const createdAt = new Date(record.created_at).getTime();
              const verifiedAt = new Date(record.verified_at).getTime();
              return (verifiedAt - createdAt) < 5 * 60 * 1000;
            })();
            return (
            <div key={record.id} className={`bg-background/50 border rounded-lg p-3 ${record.verified_at ? "border-l-4" : ""}`}
              style={record.verified_at ? { borderLeftColor: record.accuracy_score && record.accuracy_score >= 50 ? "#22c55e" : "#ef4444" } : {}}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                <div className="flex items-center gap-2 flex-wrap">
                  {record.verified_at ? (
                    record.accuracy_score && record.accuracy_score >= 50 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-medium">{format(new Date(record.created_at), "MMM d, HH:mm")}</span>
                  {record.verified_at && record.accuracy_score !== null && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded text-white ${getAccuracyBadge(record.accuracy_score).bg}`}>{record.accuracy_score}%</span>
                  )}
                  {isAutoVerified && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Auto
                    </span>
                  )}
                  {gameFilter === "all" && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${getGameBadgeColor(record.game_type)}`}>{record.game_type}</span>
                  )}
                  {record.position && <span className="text-xs bg-muted px-2 py-0.5 rounded">{record.position}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!record.verified_at && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={(e) => { e.stopPropagation(); setVerifyingId(verifyingId === record.id ? null : record.id); }}>
                      <Target className="w-3 h-3 mr-1" /> Verify
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deletePrediction(record.id); }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                  {expandedId === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {verifyingId === record.id && (
                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input placeholder="Enter actual result (e.g., 3,5,7)" value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} className="h-8 text-xs" />
                  <Button size="sm" className="h-8 px-3" onClick={() => handleVerify(record.id)}><CheckCircle className="w-3 h-3" /></Button>
                </div>
              )}
              {record.verified_at && record.actual_result && (
                <div className="mt-2 p-2 rounded bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Actual Result:</span>
                    <div className="flex gap-1">
                      {record.actual_result.map((num, i) => (
                        <span key={i} className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-bold">{num}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {expandedId === record.id && (
                <div className="mt-3 space-y-3">
                  {record.overall_insight && <p className="text-xs text-muted-foreground italic">{record.overall_insight}</p>}
                  {record.predictions.map((pred, idx) => {
                    const matchedNumbers = record.actual_result ? pred.numbers.filter(n => record.actual_result!.includes(n)) : [];
                    return (
                      <div key={idx} className="bg-muted/30 rounded p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{pred.title}</span>
                          <div className="flex items-center gap-2">
                            {record.verified_at && matchedNumbers.length > 0 && (
                              <span className="text-[9px] text-green-500 font-medium">{matchedNumbers.length} match{matchedNumbers.length > 1 ? "es" : ""}</span>
                            )}
                            <span className={`text-xs font-bold ${getConfidenceColor(pred.confidence)}`}>{pred.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{pred.description}</p>
                        <div className="flex gap-1 mt-1">
                          {pred.numbers.map((num, i) => {
                            const isMatched = record.actual_result?.includes(num);
                            return (
                              <span key={i} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${isMatched ? "bg-green-500 text-white ring-2 ring-green-300" : "bg-primary/20 text-primary"}`}>{num}</span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={fetchHistory} className="flex-1">Refresh</Button>
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={history.length === 0} className="gap-1">
          <Download className="w-3 h-3" /> CSV
        </Button>
        <span className="text-[10px] text-muted-foreground self-center">{history.length} result{history.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};
