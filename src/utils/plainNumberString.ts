/** Plain numeric string for clipboard (no units). Trims float noise. */
export function formatPlainNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 1e8) / 1e8;
  if (Number.isInteger(rounded)) return String(Math.round(rounded));
  return String(rounded);
}
