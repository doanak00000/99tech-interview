const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number) =>
  value > 0 && value < 0.01 ? "< $0.01" : usdFormatter.format(value);

/** Display amounts: fewer decimals for large values, more for small ones. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  const text = value.toLocaleString("en-US", { maximumFractionDigits });
  return text === "0" ? `< ${10 ** -maximumFractionDigits}` : text;
}

/** Plain string (no thousands separators) suitable for an <input> value. */
export function toInputValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const decimals = value >= 1000 ? 2 : value >= 1 ? 6 : 8;
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

export const MAX_DECIMALS = 8;

/**
 * Normalise what the user typed into a decimal string, or return null to
 * reject the keystroke. Commas are accepted as the decimal separator.
 */
export function sanitizeAmount(raw: string): string | null {
  const text = raw.replace(/,/g, ".").replace(/\s/g, "");
  if (text === "") return "";
  if (!/^\d*\.?\d*$/.test(text)) return null;
  const [int, frac] = text.split(".");
  if (frac !== undefined && frac.length > MAX_DECIMALS) return null;
  const normalisedInt = int.replace(/^0+(?=\d)/, "");
  const withInt = frac !== undefined && normalisedInt === "" ? "0" : normalisedInt;
  return frac !== undefined ? `${withInt}.${frac}` : withInt;
}

/** Like toInputValue but always rounds down, so "Max" never exceeds the balance. */
export function toMaxInputValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const f = 10 ** MAX_DECIMALS;
  return (Math.floor(value * f) / f).toFixed(MAX_DECIMALS).replace(/\.?0+$/, "");
}
