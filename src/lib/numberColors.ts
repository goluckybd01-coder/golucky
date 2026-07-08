/**
 * Number color utilities for lottery games
 * Shared across lib and components to prevent circular dependencies
 */

/**
 * Get color names for a lottery number (0-9)
 * Used for bet evaluation and history display
 */
export const getNumberColors = (num: number): string[] => {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
};

/**
 * Get Tailwind text color class for a lottery number
 * Used for UI rendering
 */
export const getNumberTextColor = (num: number): string => {
  if ([1, 3, 7, 9].includes(num)) return "text-green-500";
  if ([2, 4, 6, 8].includes(num)) return "text-red-500";
  return "text-purple-500";
};
