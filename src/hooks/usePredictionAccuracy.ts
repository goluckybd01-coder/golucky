import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PredictionToVerify {
  id: string;
  game_type: string;
  predictions: Array<{
    numbers: number[];
    confidence: number;
  }>;
}

export const usePredictionAccuracy = () => {
  
  // Calculate accuracy score based on how many predicted numbers matched
  const calculateAccuracy = (
    predictedNumbers: number[][],
    actualResult: number[]
  ): number => {
    if (!actualResult.length || !predictedNumbers.length) return 0;
    
    let totalMatches = 0;
    let totalPredicted = 0;
    
    predictedNumbers.forEach(nums => {
      nums.forEach(num => {
        totalPredicted++;
        if (actualResult.includes(num)) {
          totalMatches++;
        }
      });
    });
    
    return totalPredicted > 0 ? Math.round((totalMatches / totalPredicted) * 100) : 0;
  };

  // Verify a single prediction with actual result
  const verifyPrediction = useCallback(async (
    predictionId: string,
    actualResult: number[]
  ) => {
    try {
      // Get the prediction
      const { data: prediction, error: fetchError } = await supabase
        .from("ai_predictions")
        .select("predictions")
        .eq("id", predictionId)
        .maybeSingle();

      if (fetchError || !prediction) {
        console.error("Failed to fetch prediction:", fetchError);
        return null;
      }

      const predictions = prediction.predictions as Array<{ numbers: number[]; confidence: number }>;
      const predictedNumbers = predictions.map(p => p.numbers);
      const accuracy = calculateAccuracy(predictedNumbers, actualResult);

      // Update with actual result and accuracy
      const { error: updateError } = await supabase
        .from("ai_predictions")
        .update({
          actual_result: actualResult,
          accuracy_score: accuracy,
          verified_at: new Date().toISOString(),
        })
        .eq("id", predictionId);

      if (updateError) {
        console.error("Failed to update prediction:", updateError);
        return null;
      }

      return accuracy;
    } catch (err) {
      console.error("Verification error:", err);
      return null;
    }
  }, []);

  // Get accuracy stats for a user
  const getAccuracyStats = useCallback(async (gameType?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from("ai_predictions")
        .select("accuracy_score, game_type")
        .eq("user_id", user.id)
        .not("accuracy_score", "is", null);

      if (gameType) {
        query = query.eq("game_type", gameType);
      }

      const { data, error } = await query;

      if (error || !data?.length) return null;

      const scores = data.map(d => Number(d.accuracy_score));
      const avgAccuracy = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const highAccuracy = scores.filter(s => s >= 50).length;
      const totalVerified = scores.length;

      // Group by game type
      const byGame: Record<string, { total: number; avg: number }> = {};
      data.forEach(d => {
        if (!byGame[d.game_type]) {
          byGame[d.game_type] = { total: 0, avg: 0 };
        }
        byGame[d.game_type].total++;
        byGame[d.game_type].avg += Number(d.accuracy_score);
      });

      Object.keys(byGame).forEach(game => {
        byGame[game].avg = Math.round(byGame[game].avg / byGame[game].total);
      });

      return {
        totalVerified,
        avgAccuracy,
        highAccuracy,
        successRate: Math.round((highAccuracy / totalVerified) * 100),
        byGame,
      };
    } catch (err) {
      console.error("Stats error:", err);
      return null;
    }
  }, []);

  return {
    verifyPrediction,
    getAccuracyStats,
    calculateAccuracy,
  };
};
