/**
 * Formats a number with appropriate decimal places based on its magnitude
 * Small numbers (< 1) get more decimal places to avoid showing as 0
 * Large numbers and integers show fewer decimal places
 */
export function formatNumber(value: number, forceDecimals?: number): string {
  if (!isFinite(value)) {
    return String(value);
  }

  // If forceDecimals is provided, use it
  if (forceDecimals !== undefined) {
    return value.toFixed(forceDecimals);
  }

  // For integers, show no decimal places
  if (Number.isInteger(value)) {
    return value.toString();
  }

  const absValue = Math.abs(value);

  // For very small numbers, show more decimal places
  if (absValue > 0 && absValue < 0.01) {
    // Show up to 4 decimal places, but remove trailing zeros
    return parseFloat(value.toFixed(4)).toString();
  } else if (absValue < 0.1) {
    // Show up to 3 decimal places
    return parseFloat(value.toFixed(3)).toString();
  } else if (absValue < 1) {
    // Show up to 2 decimal places
    return parseFloat(value.toFixed(2)).toString();
  } else if (absValue < 100) {
    // Show up to 1 decimal place
    return parseFloat(value.toFixed(1)).toString();
  } else {
    // For large numbers, show no decimal places
    return Math.round(value).toString();
  }
}

/**
 * Formats a number for compact display (e.g., 1.2k, 3.4M)
 */
export function formatNumberCompact(value: number): string {
  if (!isFinite(value)) {
    return String(value);
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return sign + formatNumber(absValue / 1e9) + 'B';
  } else if (absValue >= 1e6) {
    return sign + formatNumber(absValue / 1e6) + 'M';
  } else if (absValue >= 1e3) {
    return sign + formatNumber(absValue / 1e3) + 'k';
  } else {
    return sign + formatNumber(absValue);
  }
}