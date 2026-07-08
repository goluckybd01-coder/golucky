// Currency formatting utilities for Bangladesh Taka (৳)

/**
 * Format a number as Bangladeshi Taka currency
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with ৳ symbol
 */
export const formatTaka = (amount: number, decimals: number = 2): string => {
  const formatted = amount.toFixed(decimals);
  return `৳${formatted}`;
};

/**
 * Format a number as Taka with sign prefix (+/-)
 * @param amount - The amount to format (positive or negative)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with sign and ৳ symbol
 */
export const formatTakaWithSign = (amount: number, decimals: number = 2): string => {
  const sign = amount >= 0 ? '+' : '';
  const formatted = amount.toFixed(decimals);
  return `${sign}৳${formatted}`;
};

/**
 * Format a large number as compact Taka (e.g., 1.5K, 2.3M)
 * @param amount - The amount to format
 * @returns Formatted compact string with ৳ symbol
 */
export const formatTakaCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `৳${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}K`;
  }
  return `৳${amount.toFixed(2)}`;
};

/**
 * Parse a string with Taka symbol to number
 * @param value - String that may contain ৳ symbol
 * @returns Parsed number
 */
export const parseTaka = (value: string): number => {
  const cleaned = value.replace(/[৳,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

// Taka symbol constant for consistent usage
export const TAKA_SYMBOL = '৳';

// CSS class for Taka formatting (uses Bengali font)
export const TAKA_CLASS = 'font-bengali';
