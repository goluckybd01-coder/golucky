/**
 * 5D Chart Statistics Utility
 * Accurate 'last seen distance' based missing + streak logic
 * Enhanced with trend analysis and prediction tips
 */

export interface ChartHistoryItem {
  period: string;
  digits: number[];
  sum: number;
  size: "Big" | "Small";
  parity: "Odd" | "Even";
}

export interface DigitStats {
  counts: number[];       // frequency count for each digit 0-9
  missing: number[];      // last seen distance (how many rounds since digit appeared)
  avgMissing: number[];   // average gap between appearances
  maxConsecutive: number[];  // max consecutive appearances
  streaks: number[];      // current streak (how many times in a row it appeared recently)
  hotDigits: number[];    // top 3 most frequent digits
  coldDigits: number[];   // top 3 least frequent digits
}

export interface TrendAnalysis {
  trend: "UP" | "DOWN" | "STABLE"; // Overall trend direction
  trendStrength: number; // 0-100 percentage
  recentPattern: string; // Pattern description
  bigSmallTrend: { big: number; small: number }; // Recent Big/Small ratio
  oddEvenTrend: { odd: number; even: number }; // Recent Odd/Even ratio
}

export interface PredictionTip {
  type: "hot" | "cold" | "due" | "pattern" | "streak";
  confidence: number; // 0-100
  title: string;
  description: string;
  numbers: number[];
  emoji: string;
}

/**
 * Calculate the 'last seen distance' for each digit (0-9)
 * Returns how many rounds ago each digit was last seen
 */
function calculateLastSeenDistance(values: number[]): number[] {
  const lastSeen = Array(10).fill(-1);
  
  for (let idx = 0; idx < values.length; idx++) {
    const value = values[idx];
    if (value >= 0 && value <= 9 && lastSeen[value] === -1) {
      lastSeen[value] = idx;
    }
  }
  
  // If never seen, distance is the total length
  return lastSeen.map((seen, _) => (seen === -1 ? values.length : seen));
}

/**
 * Calculate frequency counts for each digit
 */
function calculateFrequency(values: number[]): number[] {
  const counts = Array(10).fill(0);
  for (const value of values) {
    if (value >= 0 && value <= 9) {
      counts[value]++;
    }
  }
  return counts;
}

/**
 * Calculate average missing (average gap between appearances)
 * Formula: totalRounds / frequency
 */
function calculateAvgMissing(counts: number[], totalRounds: number): number[] {
  return counts.map(count => (count > 0 ? Math.round(totalRounds / count) : totalRounds));
}

/**
 * Calculate max consecutive appearances for each digit
 * Tracks the longest streak of consecutive rounds where each digit appeared
 */
function calculateMaxConsecutive(values: number[]): number[] {
  const maxConsecutive = Array(10).fill(0);
  const currentStreak = Array(10).fill(0);
  
  for (const value of values) {
    if (value >= 0 && value <= 9) {
      // Increment streak for this digit
      currentStreak[value]++;
      maxConsecutive[value] = Math.max(maxConsecutive[value], currentStreak[value]);
      
      // Reset streak for all other digits
      for (let i = 0; i < 10; i++) {
        if (i !== value) {
          currentStreak[i] = 0;
        }
      }
    }
  }
  
  return maxConsecutive;
}

/**
 * Calculate current streak for each digit
 * How many times in a row from the start (most recent) each digit appeared
 */
function calculateCurrentStreak(values: number[]): number[] {
  const streaks = Array(10).fill(0);
  
  if (values.length === 0) return streaks;
  
  const firstValue = values[0];
  if (firstValue < 0 || firstValue > 9) return streaks;
  
  let streak = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] === firstValue) {
      streak++;
    } else {
      break;
    }
  }
  
  streaks[firstValue] = streak;
  return streaks;
}

/**
 * Get hot digits (most frequent) and cold digits (least frequent)
 */
function getHotColdDigits(counts: number[]): { hot: number[]; cold: number[] } {
  const indexed = counts.map((count, digit) => ({ digit, count }));
  
  // Sort by count descending for hot
  const sortedByHot = [...indexed].sort((a, b) => b.count - a.count);
  const hot = sortedByHot.slice(0, 3).map(item => item.digit);
  
  // Sort by count ascending for cold (excluding zeros if possible)
  const sortedByCold = [...indexed].sort((a, b) => a.count - b.count);
  const cold = sortedByCold.slice(0, 3).map(item => item.digit);
  
  return { hot, cold };
}

/**
 * Analyze trend from recent values
 */
export function analyzeTrend(history: ChartHistoryItem[], digitIndex: number): TrendAnalysis {
  const defaultTrend: TrendAnalysis = {
    trend: "STABLE",
    trendStrength: 50,
    recentPattern: "No clear pattern",
    bigSmallTrend: { big: 50, small: 50 },
    oddEvenTrend: { odd: 50, even: 50 },
  };

  if (!history || history.length < 10) return defaultTrend;

  const recent = history.slice(0, 20);
  const isSumTab = digitIndex === -1;
  
  // Extract values
  const values = recent.map(h => {
    if (isSumTab) return h.sum % 10;
    return h.digits?.[digitIndex] ?? 0;
  });

  // Calculate trend direction (compare first half vs second half averages)
  const firstHalf = values.slice(0, 10);
  const secondHalf = values.slice(10, 20);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : firstAvg;
  
  const diff = firstAvg - secondAvg;
  let trend: "UP" | "DOWN" | "STABLE" = "STABLE";
  let trendStrength = 50;
  
  if (diff > 1.5) {
    trend = "UP";
    trendStrength = Math.min(90, 50 + diff * 10);
  } else if (diff < -1.5) {
    trend = "DOWN";
    trendStrength = Math.min(90, 50 + Math.abs(diff) * 10);
  }

  // Big/Small and Odd/Even trends
  let bigCount = 0, oddCount = 0;
  recent.forEach(h => {
    const v = isSumTab ? h.sum : (h.digits?.[digitIndex] ?? 0);
    if (isSumTab ? h.sum >= 23 : v >= 5) bigCount++;
    if (v % 2 === 1) oddCount++;
  });
  
  const bigPercent = Math.round((bigCount / recent.length) * 100);
  const oddPercent = Math.round((oddCount / recent.length) * 100);

  // Detect patterns
  let recentPattern = "Mixed results";
  if (bigPercent >= 70) recentPattern = "🔥 Big numbers dominant";
  else if (bigPercent <= 30) recentPattern = "❄️ Small numbers dominant";
  else if (oddPercent >= 70) recentPattern = "🎯 Odd numbers streak";
  else if (oddPercent <= 30) recentPattern = "⭐ Even numbers streak";
  else if (trendStrength >= 70) recentPattern = trend === "UP" ? "📈 Upward trend" : "📉 Downward trend";

  return {
    trend,
    trendStrength: Math.round(trendStrength),
    recentPattern,
    bigSmallTrend: { big: bigPercent, small: 100 - bigPercent },
    oddEvenTrend: { odd: oddPercent, even: 100 - oddPercent },
  };
}

/**
 * Generate prediction tips based on statistics
 */
export function generatePredictionTips(
  stats: DigitStats,
  trend: TrendAnalysis,
  history: ChartHistoryItem[],
  digitIndex: number
): PredictionTip[] {
  const tips: PredictionTip[] = [];

  // Hot numbers tip
  if (stats.hotDigits.length > 0) {
    const hotFreq = stats.hotDigits.map(d => stats.counts[d]);
    const avgFreq = hotFreq.reduce((a, b) => a + b, 0) / hotFreq.length;
    const confidence = Math.min(85, 50 + avgFreq * 2);
    
    tips.push({
      type: "hot",
      confidence: Math.round(confidence),
      title: "🔥 Hot Numbers",
      description: "Most frequent in last 100 rounds",
      numbers: stats.hotDigits,
      emoji: "🔥",
    });
  }

  // Cold numbers (due to appear)
  if (stats.coldDigits.length > 0) {
    const coldMissing = stats.coldDigits.map(d => stats.missing[d]);
    const avgMissing = coldMissing.reduce((a, b) => a + b, 0) / coldMissing.length;
    const confidence = Math.min(75, 40 + avgMissing * 3);
    
    tips.push({
      type: "cold",
      confidence: Math.round(confidence),
      title: "❄️ Cold Numbers",
      description: "Least frequent - may be due",
      numbers: stats.coldDigits,
      emoji: "❄️",
    });
  }

  // Due numbers (high missing count)
  const dueNumbers = stats.missing
    .map((m, i) => ({ digit: i, missing: m }))
    .filter(d => d.missing >= 15)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 3)
    .map(d => d.digit);

  if (dueNumbers.length > 0) {
    const avgMissing = dueNumbers.map(d => stats.missing[d]).reduce((a, b) => a + b, 0) / dueNumbers.length;
    tips.push({
      type: "due",
      confidence: Math.min(70, 35 + avgMissing),
      title: "⏰ Overdue Numbers",
      description: `Missing for ${Math.round(avgMissing)}+ rounds`,
      numbers: dueNumbers,
      emoji: "⏰",
    });
  }

  // Pattern-based tip
  if (trend.trend !== "STABLE") {
    const patternNumbers = trend.trend === "UP" 
      ? [5, 6, 7, 8, 9].filter(n => stats.hotDigits.includes(n) || stats.missing[n] < 5)
      : [0, 1, 2, 3, 4].filter(n => stats.hotDigits.includes(n) || stats.missing[n] < 5);
    
    if (patternNumbers.length >= 2) {
      tips.push({
        type: "pattern",
        confidence: Math.round(trend.trendStrength),
        title: trend.trend === "UP" ? "📈 Trend Suggests High" : "📉 Trend Suggests Low",
        description: trend.recentPattern,
        numbers: patternNumbers.slice(0, 3),
        emoji: trend.trend === "UP" ? "📈" : "📉",
      });
    }
  }

  // Streak tip
  const activeStreak = stats.streaks.findIndex(s => s >= 2);
  if (activeStreak !== -1 && stats.streaks[activeStreak] >= 2) {
    tips.push({
      type: "streak",
      confidence: Math.min(60, 30 + stats.streaks[activeStreak] * 10),
      title: "🎰 Active Streak",
      description: `${activeStreak} appeared ${stats.streaks[activeStreak]}x in a row`,
      numbers: [activeStreak],
      emoji: "🎰",
    });
  }

  // Sort by confidence
  return tips.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

/**
 * Generate complete statistics for a specific digit position or sum
 * @param history - Array of chart history items (most recent first)
 * @param digitIndex - Index of digit (0-4 for A-E) or -1 for SUM
 * @param maxRounds - Maximum rounds to analyze (default 100)
 */
export function generateDigitStats(
  history: ChartHistoryItem[],
  digitIndex: number,
  maxRounds: number = 100
): DigitStats {
  const emptyStats: DigitStats = {
    counts: Array(10).fill(0),
    missing: Array(10).fill(0),
    avgMissing: Array(10).fill(0),
    maxConsecutive: Array(10).fill(0),
    streaks: Array(10).fill(0),
    hotDigits: [],
    coldDigits: []
  };

  if (!history || history.length === 0) {
    return emptyStats;
  }

  const limitedHistory = history.slice(0, maxRounds);
  const isSumTab = digitIndex === -1;
  
  // Extract values for analysis
  const values = limitedHistory.map(h => {
    if (isSumTab) {
      return h.sum % 10; // Use last digit of sum for 0-9 range
    }
    return h.digits?.[digitIndex] ?? 0;
  });

  const counts = calculateFrequency(values);
  const missing = calculateLastSeenDistance(values);
  const avgMissing = calculateAvgMissing(counts, limitedHistory.length);
  const maxConsecutive = calculateMaxConsecutive(values);
  const streaks = calculateCurrentStreak(values);
  const { hot, cold } = getHotColdDigits(counts);

  return {
    counts,
    missing,
    avgMissing,
    maxConsecutive,
    streaks,
    hotDigits: hot,
    coldDigits: cold
  };
}

/**
 * Get digit label from index
 */
export function getDigitLabel(index: number): string {
  const labels = ["A", "B", "C", "D", "E"];
  return index >= 0 && index < 5 ? labels[index] : "SUM";
}

/**
 * Parse digit index from label
 */
export function parseDigitIndex(label: string): number {
  const labels = ["A", "B", "C", "D", "E"];
  const idx = labels.indexOf(label);
  return idx >= 0 ? idx : -1; // -1 for SUM
}
