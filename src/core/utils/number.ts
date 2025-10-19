import { format as formatNumber } from "numfmt";

/**
 * Safely formats a number using the numfmt library.
 * If formatting fails, returns the value as a string.
 * 
 * @param format - The format string for numfmt
 * @param value - The number to format
 * @returns The formatted string or the original value as string if formatting fails
 */
export const safeFormatNumber = (format: string, value: number): string => {
  try {
    return formatNumber(format, value);
  } catch (error) {
    return value.toString();
  }
};