/**
 * Sri Lankan Rupee (LKR) Formatting Utilities for Best 1 Suit
 */

export const CURRENCY_SYMBOL = 'LKR';
export const CURRENCY_CODE = 'LKR';

/**
 * Formats a monetary number in Sri Lankan Rupees (e.g., LKR 4,500.00 or LKR 4,500)
 */
export function formatLKR(amount: number | string | undefined | null, includeDecimals: boolean = true): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return includeDecimals ? 'LKR 0.00' : 'LKR 0';

  return `LKR ${num.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}

/**
 * Compact Sri Lankan Rupee formatter for chart axes and summary pills (e.g., LKR 45k)
 */
export function formatLKRCompact(amount: number): string {
  if (amount >= 1000000) {
    return `LKR ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `LKR ${(amount / 1000).toFixed(0)}k`;
  }
  return `LKR ${amount.toLocaleString()}`;
}

