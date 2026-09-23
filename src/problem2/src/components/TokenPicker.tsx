import { useEffect, useMemo, useRef, useState } from "react";
import type { Token } from "../lib/tokens";
import { formatAmount, formatUsd } from "../lib/format";
import { TokenIcon } from "./TokenIcon";

interface Props {
  tokens: Token[];
  balances: Record<string, number>;
  selected: string;
  /** The token on the other side; picking it swaps the two sides. */
  counterpart: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

export function TokenPicker({ tokens, balances, selected, counterpart, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? tokens.filter((t) => t.symbol.toLowerCase().includes(q)) : tokens;
    // Tokens the user holds the most (in USD) come first.
    return [...matches].sort(
      (a, b) => (balances[b.symbol] ?? 0) * b.price - (balances[a.symbol] ?? 0) * a.price
    );
  }, [tokens, balances, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      onSelect(results[active].symbol);
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className="picker-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onKeyDown={onKeyDown}
      >
        <header className="picker__header">
          <h2 id="picker-title">Select a token</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <input
          className="picker__search"
          type="search"
          placeholder="Search by symbol"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-controls="token-list"
          aria-activedescendant={results[active] ? `token-${results[active].symbol}` : undefined}
          aria-label="Search tokens"
        />

        <ul id="token-list" className="picker__list" ref={listRef} role="listbox" aria-label="Tokens">
          {results.map((token, index) => {
            const balance = balances[token.symbol] ?? 0;
            return (
              <li key={token.symbol} role="presentation">
                <button
                  type="button"
                  id={`token-${token.symbol}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={token.symbol === selected}
                  data-index={index}
                  className={`picker__item${index === active ? " is-active" : ""}`}
                  onMouseMove={() => setActive(index)}
                  onClick={() => onSelect(token.symbol)}
                >
                  <TokenIcon symbol={token.symbol} size={32} />
                  <span className="picker__meta">
                    <span className="picker__symbol">
                      {token.symbol}
                      {token.symbol === selected && <span className="tag">Selected</span>}
                      {token.symbol === counterpart && <span className="tag tag--muted">Other side</span>}
                    </span>
                    <span className="picker__price">{formatUsd(token.price)}</span>
                  </span>
                  <span className="picker__balance">
                    <span>{formatAmount(balance)}</span>
                    <span className="picker__price">{formatUsd(balance * token.price)}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="picker__empty">No tokens match “{query}”.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
