export interface Token {
  symbol: string;
  /** USD price of one unit. */
  price: number;
  /** ISO timestamp of the price quote. */
  updatedAt: string;
}

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

/** The icon repo uses different casing for a few liquid-staking symbols. */
const ICON_ALIASES: Record<string, string> = {
  STEVMOS: "stEVMOS",
  RATOM: "rATOM",
  STOSMO: "stOSMO",
  STATOM: "stATOM",
  STLUNA: "stLUNA",
};

export const iconUrl = (symbol: string) =>
  `${ICON_BASE}/${ICON_ALIASES[symbol] ?? symbol}.svg`;

interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

/**
 * Fetch prices and normalise them into one entry per token.
 * The feed has duplicate currencies, so keep the most recent quote.
 * Tokens without a positive price cannot be swapped and are left out.
 */
export async function fetchTokens(signal?: AbortSignal): Promise<Token[]> {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Price feed responded with ${res.status}`);
  const entries: PriceEntry[] = await res.json();

  const latest = new Map<string, PriceEntry>();
  for (const entry of entries) {
    if (!(entry.price > 0)) continue;
    const prev = latest.get(entry.currency);
    if (!prev || Date.parse(entry.date) > Date.parse(prev.date)) {
      latest.set(entry.currency, entry);
    }
  }

  return [...latest.values()]
    .map((e) => ({ symbol: e.currency, price: e.price, updatedAt: e.date }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/**
 * Mock wallet: give each token a balance worth a few thousand USD,
 * derived from its symbol so the numbers stay stable between reloads.
 */
export function mockBalances(tokens: Token[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const token of tokens) {
    let hash = 0;
    for (const ch of token.symbol) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const usd = 500 + (hash % 4500);
    balances[token.symbol] = roundDown(usd / token.price, 6);
  }
  return balances;
}

const roundDown = (value: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.floor(value * f) / f;
};
