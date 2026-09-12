// Utility for bespoke tailoring fractional imperial system (inches)

export interface FractionOption {
  label: string;      // e.g. "½"
  ascii: string;      // e.g. "1/2"
  value: number;      // e.g. 0.5
  description: string; // e.g. "Half inch"
}

export const COMMON_FRACTIONS: FractionOption[] = [
  { label: '0', ascii: '0', value: 0, description: 'Exact whole' },
  { label: '⅛', ascii: '1/8', value: 0.125, description: 'One eighth (1/8")' },
  { label: '¼', ascii: '1/4', value: 0.25, description: 'One quarter (1/4")' },
  { label: '⅜', ascii: '3/8', value: 0.375, description: 'Three eighths (3/8")' },
  { label: '½', ascii: '1/2', value: 0.5, description: 'Half inch (1/2")' },
  { label: '⅝', ascii: '5/8', value: 0.625, description: 'Five eighths (5/8")' },
  { label: '¾', ascii: '3/4', value: 0.75, description: 'Three quarters (3/4")' },
  { label: '⅞', ascii: '7/8', value: 0.875, description: 'Seven eighths (7/8")' },
];

const UNICODE_FRACTION_MAP: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

/**
 * Parses any fractional or decimal string into a standard numeric inch value.
 * Supports: "15 1/2", "15 ½", "15-1/2", "15.5", "15 3/8", "3/4", "15"
 */
export function parseFractionalInches(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  if (!input || typeof input !== 'string') {
    return 0;
  }

  let text = input.trim().replace(/["”]/g, '').trim();
  if (!text) return 0;

  // Check for unicode fractions like "15 ½" or "½"
  for (const [char, fracVal] of Object.entries(UNICODE_FRACTION_MAP)) {
    if (text.includes(char)) {
      const rest = text.replace(char, '').trim();
      const whole = rest ? parseFloat(rest) || 0 : 0;
      return whole + fracVal;
    }
  }

  // Check for dash or space separating whole and fraction: "15 1/2" or "15-1/2"
  const parts = text.split(/[\s-]+/);
  if (parts.length === 2) {
    const whole = parseFloat(parts[0]) || 0;
    const fracParts = parts[1].split('/');
    if (fracParts.length === 2) {
      const num = parseFloat(fracParts[0]) || 0;
      const den = parseFloat(fracParts[1]) || 1;
      return whole + (num / den);
    }
  } else if (parts.length === 1 && text.includes('/')) {
    const fracParts = text.split('/');
    const num = parseFloat(fracParts[0]) || 0;
    const den = parseFloat(fracParts[1]) || 1;
    return num / den;
  }

  // Fallback to standard float
  const parsed = parseFloat(text);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Splits a decimal inch value into whole inches and closest 1/8" fraction
 */
export function splitToWholeAndFraction(val: number): {
  whole: number;
  fractionValue: number;
  fractionAscii: string;
  fractionUnicode: string;
  fractionIndex: number;
} {
  if (!val || isNaN(val) || val <= 0) {
    return {
      whole: 0,
      fractionValue: 0,
      fractionAscii: '',
      fractionUnicode: '',
      fractionIndex: 0,
    };
  }

  const whole = Math.floor(val);
  const remainder = val - whole;

  // Snap remainder to nearest 1/8th inch (0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875)
  const eighths = Math.round(remainder * 8);

  if (eighths === 0) {
    return { whole, fractionValue: 0, fractionAscii: '', fractionUnicode: '', fractionIndex: 0 };
  }
  if (eighths >= 8) {
    return { whole: whole + 1, fractionValue: 0, fractionAscii: '', fractionUnicode: '', fractionIndex: 0 };
  }

  const opt = COMMON_FRACTIONS[eighths];
  return {
    whole,
    fractionValue: opt.value,
    fractionAscii: opt.ascii,
    fractionUnicode: opt.label,
    fractionIndex: eighths,
  };
}

/**
 * Formats a measurement as a clean bespoke tailoring fractional imperial string.
 * Examples:
 *  40 -> 40"
 *  40.5 -> 40 ½"
 *  40.25 -> 40 ¼"
 *  40.375 -> 40 ⅜"
 *  40.125 -> 40 ⅛"
 *  40.625 -> 40 ⅝"
 *  40.75 -> 40 ¾"
 *  40.875 -> 40 ⅞"
 */
export function formatFractionalInches(
  val: number | string | undefined | null,
  options: { showUnit?: boolean; useUnicode?: boolean } = { showUnit: true, useUnicode: true }
): string {
  const { showUnit = true, useUnicode = true } = options;

  if (val === undefined || val === null || val === '') return showUnit ? `0"` : '0';

  const numVal = typeof val === 'number' ? val : parseFractionalInches(val);
  if (isNaN(numVal) || numVal === 0) return showUnit ? `0"` : '0';

  const { whole, fractionAscii, fractionUnicode } = splitToWholeAndFraction(numVal);
  const frac = useUnicode ? fractionUnicode : fractionAscii;

  let result = '';
  if (whole === 0 && frac) {
    result = frac;
  } else if (frac) {
    result = `${whole} ${frac}`;
  } else {
    result = `${whole}`;
  }

  return showUnit ? `${result}"` : result;
}
