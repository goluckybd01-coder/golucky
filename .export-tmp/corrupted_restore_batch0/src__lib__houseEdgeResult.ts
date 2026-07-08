/**
 * HOUSE EDGE RESULT GENERATOR
 */
import { loadMyHistory } from "@/lib/gameStorage";
const HOUSE_WIN_PROBABILITY = 0.75;
interface WinGoBetInfo { betType: string; betValue?: string; }
export function generateBiasedWinGoNumber(pendingBets: WinGoBetInfo[], gameType: string): number {
  if (!pendingBets || pendingBets.length === 0) return Math.floor(Math.random() * 10);
  const houseWins = Math.random() < HOUSE_WIN_PROBABILITY;
  if (!houseWins) return Math.floor(Math.random() * 10);
  const betAnalysis = analyzWinGoBets(pendingBets);
  let bestNumber = Math.floor(Math.random() * 10);
  let maxLosses = 0;
  for (let num = 0; num <= 9; num++) {
    const losses = countWinGoLosses(num, betAnalysis);
    if (losses > maxLosses) { maxLosses = losses; bestNumber = num; }
  }
  return bestNumber;
}
interface WinGoBetAnalysis { numbers: number[]; colors: string[]; bigSmall: ("Big" | "Small")[]; }
function analyzWinGoBets(bets: WinGoBetInfo[]): WinGoBetAnalysis {
  const analysis: WinGoBetAnalysis = { numbers: [], colors: [], bigSmall: [] };
  for (const bet of bets) {
    const betType = bet.betType?.toLowerCase() || "";
    const numberMatch = betType.match(/number\s*(\d)/i) || betType.match(/^(\d)$/);
    if (numberMatch) { analysis.numbers.push(parseInt(numberMatch[1])); continue; }
    if (betType.includes("green")) analysis.colors.push("green");
    else if (betType.includes("red")) analysis.colors.push("red");
    else if (betType.includes("violet")) analysis.colors.push("violet");
    if (betType.includes("big")) analysis.bigSmall.push("Big");
    else if (betType.includes("small")) analysis.bigSmall.push("Small");
  }
  return analysis;
}
function getWinGoColors(num: number): string[] {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
}
function countWinGoLosses(num: number, analysis: WinGoBetAnalysis): number {
  let losses = 0;
  const colors = getWinGoColors(num);
  const bigSmall = num >= 5 ? "Big" : "Small";
  for (const betNum of analysis.numbers) if (betNum !== num) losses++;
  for (const betColor of analysis.colors) if (!colors.includes(betColor)) losses++;
  for (const betBS of analysis.bigSmall) if (betBS !== bigSmall) losses++;
  return losses;
}
interface K3BetInfo { betType: string; betValue?: string; }
export function generateBiasedK3Dice(pendingBets: K3BetInfo[], gameType: string): [number, number, number] {
  if (!pendingBets?.length) return [1,1,1].map(() => Math.floor(Math.random()*6)+1) as [number,number,number];
  if (Math.random() >= HOUSE_WIN_PROBABILITY) return [1,1,1].map(() => Math.floor(Math.random()*6)+1) as [number,number,number];
  const betAnalysis = analyzeK3Bets(pendingBets);
  let bestDice: [number,number,number] = [1,1,1];
  let maxLosses = 0;
  for (let i=0;i<50;i++) {
    const testDice: [number,number,number] = [1,1,1].map(() => Math.floor(Math.random()*6)+1) as [number,number,number];
    const losses = countK3Losses(testDice, betAnalysis);
    if (losses > maxLosses) { maxLosses = losses; bestDice = testDice; }
  }
  return bestDice;
}
interface K3BetAnalysis { sums: number[]; bigSmall: ("Big"|"Small")[]; oddEven: ("Odd"|"Even")[]; }
function analyzeK3Bets(bets: K3BetInfo[]): K3BetAnalysis {
  const analysis: K3BetAnalysis = { sums: [], bigSmall: [], oddEven: [] };
  for (const bet of bets) {
    const betType = bet.betType?.toLowerCase() || "";
    const betValue = bet.betValue || "";
    if (betType === "number" && betValue) { const sum = parseInt(betValue); if (!isNaN(sum)) analysis.sums.push(sum); }
    if (betType === "bigsmall") {
      if (betValue === "Big") analysis.bigSmall.push("Big");
      else if (betValue === "Small") analysis.bigSmall.push("Small");
      else if (betValue === "Odd") analysis.oddEven.push("Odd");
      else if (betValue === "Even") analysis.oddEven.push("Even");
    }
  }
  return analysis;
}
function countK3Losses(dice: [number,number,number], analysis: K3BetAnalysis): number {
  let losses = 0; const sum = dice[0]+dice[1]+dice[2]; const isBig = sum >= 11; const isOdd = sum % 2 === 1;
  for (const betSum of analysis.sums) if (betSum !== sum) losses++;
  for (const betBS of analysis.bigSmall) if ((betBS === "Big" && !isBig) || (betBS === "Small" && isBig)) losses++;
  for (const betOE of analysis.oddEven) if ((betOE === "Odd" && !isOdd) || (betOE === "Even" && isOdd)) losses++;
  return losses;
}
interface FiveDBetInfo { betType: string; betValue?: string; }
export function generateBiased5DDigits(pendingBets: FiveDBetInfo[], gameType: string): [number,number,number,number,number] {
  const rand5 = () => [0,0,0,0,0].map(() => Math.floor(Math.random()*10)) as [number,number,number,number,number];
  if (!pendingBets?.length) return rand5();
  if (Math.random() >= HOUSE_WIN_PROBABILITY) return rand5();
  let bestDigits: [number,number,number,number,number] = [0,0,0,0,0];
  let maxLosses = 0;
  for (let i=0;i<50;i++) { const test = rand5(); const losses = count5DLosses(test, pendingBets); if (losses>maxLosses){maxLosses=losses;bestDigits=test;} }
  return bestDigits;
}
function count5DLosses(digits: [number,number,number,number,number], bets: FiveDBetInfo[]): number {
  let losses = 0; const sum = digits.reduce((a,b)=>a+b,0);
  const digitMap: Record<string,number> = { A:digits[0],B:digits[1],C:digits[2],D:digits[3],E:digits[4],SUM:sum };
  for (const bet of bets) {
    const betType = (bet.betType||"").toLowerCase(); const parts = betType.split(/[_\s-]+/);
    const digitPart = parts[0]?.toUpperCase()||"A"; const typePart = parts[1]||"big"; const value = digitMap[digitPart]??0;
    let isWin = false;
    if (typePart==="big") isWin = digitPart==="SUM"?sum>=23:value>=5;
    else if (typePart==="small") isWin = digitPart==="SUM"?sum<23:value<5;
    else if (typePart==="odd") isWin = value%2===1;
    else if (typePart==="even") isWin = value%2===0;
    else if (typePart==="number") isWin = value===parseInt(parts[2]||"0");
    else if (typePart==="range") { const [min,max]=parts.slice(2).join("-").split("-").map(Number); isWin = sum>=min&&sum<=max; }
    if (!isWin) losses++;
  }
  return losses;
}
export function getPendingBetsForRound(game: "winGo"|"k3"|"fiveD"|"trxWin", gameType: string, roundKey: string): any[] {
  try {
    return loadMyHistory(game, gameType).filter((entry:any)=>entry.result===null && (entry.roundKey||"")===roundKey);
  } catch { return []; }
}
