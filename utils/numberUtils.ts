/**
 * Rounds a number to given decimals (standard Math.round)
 */
export function roundToDecimals(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

/**
 * Round to decimals then clamp to max (default 0.8)
 */
export function roundAndClamp(n: number, decimals = 1, max = 0.8): number {
  const rounded = roundToDecimals(n, decimals);
  return Math.min(rounded, max);
}

export default { roundToDecimals, roundAndClamp };
