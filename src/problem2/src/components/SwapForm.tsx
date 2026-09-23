import { useId, useMemo, useState } from "react";
import type { Token } from "../lib/tokens";
import { formatAmount, formatUsd, sanitizeAmount, toInputValue, toMaxInputValue } from "../lib/format";
import { TokenIcon } from "./TokenIcon";
import { TokenPicker } from "./TokenPicker";

type Side = "from" | "to";

interface Props {
  tokens: Token[];
  balances: Record<string, number>;
  onSwap: (from: string, to: string, amountIn: number, amountOut: number) => Promise<void>;
}

interface Receipt {
  from: string;
  to: string;
  amountIn: number;
  amountOut: number;
}

const SLIPPAGE = 0.005;

export function SwapForm({ tokens, balances, onSwap }: Props) {
  const bySymbol = useMemo(() => new Map(tokens.map((t) => [t.symbol, t])), [tokens]);
  const pick = (preferred: string, fallback: number) =>
    bySymbol.has(preferred) ? preferred : tokens[fallback]?.symbol ?? "";

  const [fromSymbol, setFromSymbol] = useState(() => pick("ETH", 0));
  const [toSymbol, setToSymbol] = useState(() => pick("USDC", 1));
  // Only the field the user typed in is stored. The other one is derived from it.
  const [input, setInput] = useState<{ side: Side; value: string }>({ side: "from", value: "" });
  const [pickerFor, setPickerFor] = useState<Side | null>(null);
  const [invertRate, setInvertRate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const fromToken = bySymbol.get(fromSymbol);
  const toToken = bySymbol.get(toSymbol);
  const rate = fromToken && toToken ? fromToken.price / toToken.price : 0;

  const typed = Number(input.value) || 0;
  const amountIn = input.side === "from" ? typed : rate ? typed / rate : 0;
  const amountOut = input.side === "to" ? typed : typed * rate;
  const fromValue = input.side === "from" ? input.value : toInputValue(amountIn);
  const toValue = input.side === "to" ? input.value : toInputValue(amountOut);

  const balance = balances[fromSymbol] ?? 0;
  const error = (() => {
    if (!input.value) return null;
    if (amountIn <= 0) return "Enter an amount greater than 0";
    // Small tolerance so that "Max" is not rejected because of float rounding.
    if (amountIn > balance * (1 + 1e-9)) return `Insufficient ${fromSymbol} balance`;
    return null;
  })();
  const canSubmit = !!input.value && !error && !submitting;

  const ids = { from: useId(), to: useId(), error: useId() };

  const onAmountChange = (side: Side, raw: string) => {
    const value = sanitizeAmount(raw);
    if (value === null) return;
    setSubmitError(null);
    setInput({ side, value });
  };

  const flip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    // Keep the typed number next to the token it belongs to.
    setInput((prev) => ({ side: prev.side === "from" ? "to" : "from", value: prev.value }));
  };

  const selectToken = (side: Side, symbol: string) => {
    const other = side === "from" ? toSymbol : fromSymbol;
    if (symbol === other) {
      flip();
    } else if (side === "from") {
      setFromSymbol(symbol);
    } else {
      setToSymbol(symbol);
    }
    setPickerFor(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSwap(fromSymbol, toSymbol, amountIn, amountOut);
      setReceipt({ from: fromSymbol, to: toSymbol, amountIn, amountOut });
      setInput({ side: "from", value: "" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Swap failed, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section className="card receipt" aria-live="polite">
        <div className="receipt__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="receipt__title">Swap complete</h1>
        <div className="receipt__pair">
          <span><TokenIcon symbol={receipt.from} size={20} /> {formatAmount(receipt.amountIn)} {receipt.from}</span>
          <span className="receipt__arrow" aria-label="to">→</span>
          <span><TokenIcon symbol={receipt.to} size={20} /> {formatAmount(receipt.amountOut)} {receipt.to}</span>
        </div>
        <p className="receipt__note">
          New balance: {formatAmount(balances[receipt.to] ?? 0)} {receipt.to}
        </p>
        <button type="button" className="submit" onClick={() => setReceipt(null)} autoFocus>
          New swap
        </button>
      </section>
    );
  }

  const rateText = invertRate
    ? `1 ${toSymbol} = ${formatAmount(1 / rate)} ${fromSymbol}`
    : `1 ${fromSymbol} = ${formatAmount(rate)} ${toSymbol}`;

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <header className="card__header">
        <h1>Swap</h1>
        <span className="card__sub">Prices from Switcheo · mock wallet</span>
      </header>

      <div className={`field${error ? " field--error" : ""}`}>
        <div className="field__top">
          <label htmlFor={ids.from}>You pay</label>
          <span className="field__balance">
            Balance {formatAmount(balance)}
            <button
              type="button"
              className="chip"
              onClick={() => onAmountChange("from", toMaxInputValue(balance))}
              disabled={balance <= 0}
            >
              Max
            </button>
          </span>
        </div>
        <div className="field__row">
          <input
            id={ids.from}
            className="field__input"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={fromValue}
            onChange={(e) => onAmountChange("from", e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? ids.error : undefined}
          />
          <TokenButton symbol={fromSymbol} onClick={() => setPickerFor("from")} />
        </div>
        <div className="field__usd">{formatUsd(amountIn * (fromToken?.price ?? 0))}</div>
      </div>

      <div className="flip-wrap">
        <button type="button" className="flip" onClick={flip} aria-label="Switch tokens">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M7 4v15m0 0l-3-3m3 3l3-3M17 20V5m0 0l-3 3m3-3l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="field">
        <div className="field__top">
          <label htmlFor={ids.to}>You receive</label>
          <span className="field__balance">Balance {formatAmount(balances[toSymbol] ?? 0)}</span>
        </div>
        <div className="field__row">
          <input
            id={ids.to}
            className="field__input"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={toValue}
            onChange={(e) => onAmountChange("to", e.target.value)}
          />
          <TokenButton symbol={toSymbol} onClick={() => setPickerFor("to")} />
        </div>
        <div className="field__usd">{formatUsd(amountOut * (toToken?.price ?? 0))}</div>
      </div>

      {/* Validation errors are already shown on the submit button, so screen readers get them here only. */}
      <p className={`message message--error${submitError ? "" : " sr-only"}`} id={ids.error} role="alert">
        {submitError ?? error ?? ""}
      </p>

      {rate > 0 && (
        <dl className="details">
          <div>
            <dt>Rate</dt>
            <dd>
              <button
                type="button"
                className="rate-toggle"
                onClick={() => setInvertRate((v) => !v)}
                title="Invert rate"
              >
                {rateText}
              </button>
            </dd>
          </div>
          {amountOut > 0 && (
            <div>
              <dt>Minimum received ({SLIPPAGE * 100}% slippage)</dt>
              <dd>{formatAmount(amountOut * (1 - SLIPPAGE))} {toSymbol}</dd>
            </div>
          )}
        </dl>
      )}

      <button type="submit" className="submit" disabled={!canSubmit} aria-busy={submitting}>
        {submitting ? (
          <>
            <span className="spinner" aria-hidden="true" /> Swapping…
          </>
        ) : error ? (
          error
        ) : !input.value ? (
          "Enter an amount"
        ) : (
          `Swap ${fromSymbol} for ${toSymbol}`
        )}
      </button>

      {pickerFor && (
        <TokenPicker
          tokens={tokens}
          balances={balances}
          selected={pickerFor === "from" ? fromSymbol : toSymbol}
          counterpart={pickerFor === "from" ? toSymbol : fromSymbol}
          onSelect={(symbol) => selectToken(pickerFor, symbol)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </form>
  );
}

function TokenButton({ symbol, onClick }: { symbol: string; onClick: () => void }) {
  return (
    <button type="button" className="token-button" onClick={onClick} aria-label={`Select token, current ${symbol}`}>
      <TokenIcon symbol={symbol} size={24} />
      <span>{symbol}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
