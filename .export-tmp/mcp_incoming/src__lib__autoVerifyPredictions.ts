import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PredictionToVerify {
  id: string;
  predictions: Array<{ numbers: number[] }>;
  game_type: string;
  position: string | null;
  created_at: string;
}

interface AutoVerifyResult {
  verified: number;
  accuracy: number | null;
  isHighAccuracy: boolean;
  isPerfect: boolean;
}

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
      if (actualResult.includes(num)) totalMatches++;
    });
  });
  return totalPredicted > 0 ? Math.round((totalMatches / totalPredicted) * 100) : 0;
};

export const autoVerifyPredictions = async (
  gameType: string,
  actualResult: number[],
  position?: string,
  showNotification: boolean = true
): Promise<AutoVerifyResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { verified: 0, accuracy: null, isHighAccuracy: false, isPerfect: false };
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    let query = supabase
      .from("ai_predictions")
      .select("id, predictions, game_type, position, created_at")
      .eq("user_id", user.id)
      .eq("game_type", gameType)
      .is("verified_at", null)
      .gte("created_at", oneDayAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);
    if (position) query = query.eq("position", position);
    const { data: predictions, error } = await query;
    if (error || !predictions?.length) {
      return { verified: 0, accuracy: null, isHighAccuracy: false, isPerfect: false };
    }
    let verifiedCount = 0;
    let highestAccuracy = 0;
    let totalAccuracy = 0;
    for (const pred of predictions) {
      const parsedPredictions = pred.predictions as Array<{ numbers: number[] }>;
      const predictedNumbers = parsedPredictions.map(p => p.numbers);
      const accuracy = calculateAccuracy(predictedNumbers, actualResult);
      const { error: updateError } = await supabase
        .from("ai_predictions")
        .update({
          actual_result: actualResult,
          accuracy_score: accuracy,
          verified_at: new Date().toISOString(),
        })
        .eq("id", pred.id);
      if (!updateError) {
        verifiedCount++;
        totalAccuracy += accuracy;
        if (accuracy > highestAccuracy) highestAccuracy = accuracy;
      }
    }
    const avgAccuracy = verifiedCount > 0 ? Math.round(totalAccuracy / verifiedCount) : 0;
    const isHighAccuracy = highestAccuracy >= 70;
    const isPerfect = highestAccuracy === 100;
    if (showNotification && verifiedCount > 0) {
      if (isPerfect) toast.success("🎯 Perfect Prediction!", { description: `Your AI prediction was 100% accurate!`, duration: 5000 });
      else if (isHighAccuracy) toast.success("✨ High Accuracy!", { description: `Auto-verified with ${highestAccuracy}% accuracy`, duration: 4000 });
      else toast("🤖 Predictions Verified", { description: `${verifiedCount} prediction(s) verified • Avg: ${avgAccuracy}%`, duration: 3000 });
    }
    return { verified: verifiedCount, accuracy: avgAccuracy, isHighAccuracy, isPerfect };
  } catch (err) {
    console.error("[AutoVerify] Error:", err);
    return { verified: 0, accuracy: null, isHighAccuracy: false, isPerfect: false };
  }
};

export const extractResultNumbers = (gameType: string, result: any): number[] => {
  switch (gameType) {
    case "5D":
      if (result.digits && Array.isArray(result.digits)) return result.digits;
      if (typeof result.result === "string") return result.result.split("").map(Number);
      break;
    case "K3":
      if (result.dice && Array.isArray(result.dice)) return result.dice;
      break;
    case "WinGo":
    case "TrxWin":
      if (typeof result.number === "number") return [result.number];
      if (typeof result.result === "number") return [result.result];
      break;
  }
  return [];
};
