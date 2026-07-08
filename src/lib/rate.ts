export const USDT_RATE = 130;

export function bdtToUsdt(bdt: number) {
  return Number((bdt / USDT_RATE).toFixed(2));
}

export function usdtToBdt(usdt: number) {
  return usdt * USDT_RATE;
}
