export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Format a large number with K, M, B, T annotations
 * @param value - The number to format (can be bigint or number)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "1.5K", "2.3M", "1.2B")
 */
export function formatLargeNumber(
  value: bigint | number,
  decimals: number = 1,
): string {
  const num = typeof value === 'bigint' ? Number(value) : value

  if (num < 1000) {
    return num.toString()
  }

  const units = [
    {value: 1e12, symbol: 'T'},
    {value: 1e9, symbol: 'B'},
    {value: 1e6, symbol: 'M'},
    {value: 1e3, symbol: 'K'},
  ]

  for (const unit of units) {
    if (num >= unit.value) {
      const formatted = (num / unit.value).toFixed(decimals)
      // Remove trailing zeros after decimal point
      return formatted.replace(/\.?0+$/, '') + unit.symbol
    }
  }

  return num.toString()
}
