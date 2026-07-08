import { useState, useEffect, useRef } from "react";
import { Target, Trophy, Flame, Edit2, Check, X, TrendingUp, Award, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePredictionSounds } from "@/hooks/usePredictionSounds";

interface GoalSettings {
  dailyPredictions: number;
  dailyAccuracy: number;
  weeklyPredictions: number;
  weeklyAccuracy: number;
}

interface GoalProgress {
  dailyPredictionsMade: number;
  dailyAvgAccuracy: number;
  weeklyPredictionsMade: number;
  weeklyAvgAccuracy: number;
}

interface PredictionGoalsProps {
  progress: GoalProgress;
}

const DEFAULT_GOALS: GoalSettings = {
  dailyPredictions: 5,
  dailyAccuracy: 70,
  weeklyPredictions: 25,
  weeklyAccuracy: 75,
};

const STORAGE_KEY = "ai_prediction_goals";
const SOUND_ENABLED_KEY = "ai_prediction_sounds_enabled";
const ACHIEVED_GOALS_KEY = "ai_prediction_achieved_goals";

export const PredictionGoals = ({ progress }: PredictionGoalsProps) => {
  const [goals, setGoals] = useState<GoalSettings>(DEFAULT_GOALS);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<GoalSettings>(DEFAULT_GOALS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousAchievedRef = useRef<string[]>([]);

  const { playGoalAchieved, playAllGoalsCompleted } = usePredictionSounds(soundEnabled, 0.7);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(parsed);
        setEditValues(parsed);
      } catch {
        console.error("Failed to parse saved goals");
      }
    }

    const soundSaved = localStorage.getItem(SOUND_ENABLED_KEY);
    if (soundSaved !== null) {
      setSoundEnabled(soundSaved === "true");
    }

    const achievedSaved = localStorage.getItem(ACHIEVED_GOALS_KEY);
    if (achievedSaved) {
      try {
        previousAchievedRef.current = JSON.parse(achievedSaved);
      } catch {
        previousAchievedRef.current = [];
      }
    }
  }, []);

  const saveGoals = () => {
    if (editValues.dailyPredictions < 1 || editValues.dailyPredictions > 50) {
      toast.error("Daily predictions must be 1-50");
      return;
    }
    if (editValues.dailyAccuracy < 10 || editValues.dailyAccuracy > 100) {
      toast.error("Daily accuracy must be 10-100%");
      return;
    }
    if (editValues.weeklyPredictions < 1 || editValues.weeklyPredictions > 200) {
      toast.error("Weekly predictions must be 1-200");
      return;
    }
    if (editValues.weeklyAccuracy < 10 || editValues.weeklyAccuracy > 100) {
      toast.error("Weekly accuracy must be 10-100%");
      return;
    }

    setGoals(editValues);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editValues));
    setIsEditing(false);
    toast.success("🎯 Goals updated!");
  };

  const cancelEdit = () => {
    setEditValues(goals);
    setIsEditing(false);
  };

  const dailyPredProgress = Math.min(100, (progress.dailyPredictionsMade / goals.dailyPredictions) * 100);
  const dailyAccProgress = Math.min(100, (progress.dailyAvgAccuracy / goals.dailyAccuracy) * 100);
  const weeklyPredProgress = Math.min(100, (progress.weeklyPredictionsMade / goals.weeklyPredictions) * 100);
  const weeklyAccProgress = Math.min(100, (progress.weeklyAvgAccuracy / goals.weeklyAccuracy) * 100);

  const dailyPredAchieved = progress.dailyPredictionsMade >= goals.dailyPredictions;
  const dailyAccAchieved = progress.dailyAvgAccuracy >= goals.dailyAccuracy;
  const weeklyPredAchieved = progress.weeklyPredictionsMade >= goals.weeklyPredictions;
  const weeklyAccAchieved = progress.weeklyAvgAccuracy >= goals.weeklyAccuracy;

  const totalGoals = 4;
  const currentAchievedIds = [
    dailyPredAchieved ? "dailyPred" : null,
    dailyAccAchieved ? "dailyAcc" : null,
    weeklyPredAchieved ? "weeklyPred" : null,
    weeklyAccAchieved ? "weeklyAcc" : null,
  ].filter(Boolean) as string[];

  const achievedGoals = currentAchievedIds.length;

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
    toast.success(newValue ? "🔊 Sound enabled" : "🔇 Sound muted");
  };

  useEffect(() => {
    const newlyAchieved = currentAchievedIds.filter(
      (id) => !previousAchievedRef.current.includes(id)
    );

    if (newlyAchieved.length > 0) {
      localStorage.setItem(ACHIEVED_GOALS_KEY, JSON.stringify(currentAchievedIds));

      if (achievedGoals === totalGoals && previousAchievedRef.current.length < totalGoals) {
        playAllGoalsCompleted();
        toast.success("🎉 All goals completed!", { duration: 5000 });
      } else {
        playGoalAchieved();
        toast.success(`🏆 Goal achieved: ${newlyAchieved.join(", ")}!`);
      }

      previousAchievedRef.current = currentAchievedIds;
    }
  }, [currentAchievedIds, achievedGoals, playGoalAchieved, playAllGoalsCompleted]);

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Prediction Goals</h3>
              <p className="text-xs text-white/60">{achievedGoals}/{totalGoals} goals achieved</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleSound} className="w-8 h-8 text-white/70 hover:text-white hover:bg-white/10">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-white/70 hover:text-white hover:bg-white/10">
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={saveGoals} className="w-8 h-8 text-green-400 hover:text-green-300 hover:bg-green-500/20">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-3">
          {[dailyPredAchieved, dailyAccAchieved, weeklyPredAchieved, weeklyAccAchieved].map((achieved, idx) => (
            <div key={idx} className={cn("flex-1 h-2 rounded-full transition-all", achieved ? "bg-gradient-to-r from-yellow-400 to-orange-500" : "bg-white/10")} />
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <div className={cn("relative rounded-xl p-3 border transition-all", dailyPredAchieved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
          {dailyPredAchieved && <div className="absolute -top-2 -right-2"><Trophy className="w-5 h-5 text-yellow-400" /></div>}
          <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-orange-400" /><span className="text-xs text-white/70">Daily Predictions</span></div>
          {isEditing ? (
            <Input type="number" value={editValues.dailyPredictions} onChange={(e) => setEditValues({ ...editValues, dailyPredictions: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-white/10 border-white/20 text-white" min={1} max={50} />
          ) : (
            <>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">{progress.dailyPredictionsMade}</span><span className="text-sm text-white/50">/ {goals.dailyPredictions}</span></div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500", dailyPredAchieved ? "bg-green-500" : "bg-orange-500")} style={{ width: `${dailyPredProgress}%` }} /></div>
            </>
          )}
        </div>

        <div className={cn("relative rounded-xl p-3 border transition-all", dailyAccAchieved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
          {dailyAccAchieved && <div className="absolute -top-2 -right-2"><Trophy className="w-5 h-5 text-yellow-400" /></div>}
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-400" /><span className="text-xs text-white/70">Daily Accuracy</span></div>
          {isEditing ? (
            <div className="flex items-center gap-1"><Input type="number" value={editValues.dailyAccuracy} onChange={(e) => setEditValues({ ...editValues, dailyAccuracy: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-white/10 border-white/20 text-white" min={10} max={100} /><span className="text-white/50">%</span></div>
          ) : (
            <>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">{progress.dailyAvgAccuracy}%</span><span className="text-sm text-white/50">/ {goals.dailyAccuracy}%</span></div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500", dailyAccAchieved ? "bg-green-500" : "bg-blue-500")} style={{ width: `${dailyAccProgress}%` }} /></div>
            </>
          )}
        </div>

        <div className={cn("relative rounded-xl p-3 border transition-all", weeklyPredAchieved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
          {weeklyPredAchieved && <div className="absolute -top-2 -right-2"><Trophy className="w-5 h-5 text-yellow-400" /></div>}
          <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-purple-400" /><span className="text-xs text-white/70">Weekly Predictions</span></div>
          {isEditing ? (
            <Input type="number" value={editValues.weeklyPredictions} onChange={(e) => setEditValues({ ...editValues, weeklyPredictions: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-white/10 border-white/20 text-white" min={1} max={200} />
          ) : (
            <>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">{progress.weeklyPredictionsMade}</span><span className="text-sm text-white/50">/ {goals.weeklyPredictions}</span></div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500", weeklyPredAchieved ? "bg-green-500" : "bg-purple-500")} style={{ width: `${weeklyPredProgress}%` }} /></div>
            </>
          )}
        </div>

        <div className={cn("relative rounded-xl p-3 border transition-all", weeklyAccAchieved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
          {weeklyAccAchieved && <div className="absolute -top-2 -right-2"><Trophy className="w-5 h-5 text-yellow-400" /></div>}
          <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-green-400" /><span className="text-xs text-white/70">Weekly Accuracy</span></div>
          {isEditing ? (
            <div className="flex items-center gap-1"><Input type="number" value={editValues.weeklyAccuracy} onChange={(e) => setEditValues({ ...editValues, weeklyAccuracy: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-white/10 border-white/20 text-white" min={10} max={100} /><span className="text-white/50">%</span></div>
          ) : (
            <>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">{progress.weeklyAvgAccuracy}%</span><span className="text-sm text-white/50">/ {goals.weeklyAccuracy}%</span></div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500", weeklyAccAchieved ? "bg-green-500" : "bg-emerald-500")} style={{ width: `${weeklyAccProgress}%` }} /></div>
            </>
          )}
        </div>
      </div>

      {achievedGoals === totalGoals && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-yellow-400">All Goals Achieved!</span>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-xs text-white/70 mt-1">Congratulations! You've completed all your prediction goals!</p>
        </div>
      )}
    </div>
  );
};
