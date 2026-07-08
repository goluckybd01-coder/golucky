import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIPrediction {
  title: string;
  description: string;
  numbers: number[];
  confidence: number;
  reasoning: string;
}

export interface AIPredictionResponse {
  predictions: AIPrediction[];
  overallInsight: string;
}

interface PredictionStats {
  hotDigits: number[];
  coldDigits: number[];
  missing: number[];
  trend: "UP" | "DOWN" | "STABLE";
  bigSmallRatio: { big: number; small: number };
  oddEvenRatio: { odd: number; even: number };
}

export const useAIPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [overallInsight, setOverallInsight] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const savePrediction = async (
    gameType: string,
    position: string,
    predictions: AIPrediction[],
    overallInsight: string,
    stats: PredictionStats
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("ai_predictions").insert([{
        user_id: user.id,
        game_type: gameType,
        position: position || null,
        predictions: JSON.parse(JSON.stringify(predictions)),
        overall_insight: overallInsight,
        stats_snapshot: JSON.parse(JSON.stringify(stats)),
      }]);
    } catch (err) {
      console.error("Failed to save prediction:", err);
    }
  };

  const fetchPredictions = useCallback(async (
    gameType: string,
    position: string,
    recentResults: number[],
    stats: PredictionStats
  ) => {
    // Rate limit: 30 seconds between requests
    const now = Date.now();
    if (now - lastFetchTime < 30000) {
      const remaining = Math.ceil((30000 - (now - lastFetchTime)) / 1000);
      toast.info(`Please wait ${remaining}s before requesting new predictions`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-prediction", {
        body: {
          gameType,
          position,
          recentResults,
          stats,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
        setOverallInsight(data.overallInsight || "");
        setLastFetchTime(now);
        
        // Save to history
        await savePrediction(gameType, position, data.predictions, data.overallInsight || "", stats);
        
        toast.success("🤖 AI predictions generated!");
      } else {
        throw new Error("Invalid prediction format");
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get predictions";
      setError(message);
      setPredictions([]);
      
      if (message.includes("Rate limit")) {
        toast.error("⏳ Too many requests. Please wait.");
      } else if (message.includes("credits")) {
        toast.error("💳 AI credits exhausted.");
      } else {
        toast.error("❌ " + message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setOverallInsight("");
    setError(null);
  }, []);

  return {
    isLoading,
    predictions,
    overallInsight,
    error,
    fetchPredictions,
    clearPredictions,
  };
};
