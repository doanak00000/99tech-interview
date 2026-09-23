import { useCallback, useEffect, useRef, useState } from "react";
import { SwapForm } from "./components/SwapForm";
import { useTokens } from "./hooks/useTokens";
import { mockBalances } from "./lib/tokens";

const SUBMIT_DELAY_MS = 1600;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const tokens = useTokens();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const balancesRef = useRef(balances);
  balancesRef.current = balances;

  // Depend on the token array (stable once loaded), not on the hook result object.
  const tokenList = tokens.status === "ready" ? tokens.tokens : null;
  useEffect(() => {
    if (tokenList) setBalances(mockBalances(tokenList));
  }, [tokenList]);

  // Simulated backend call: wait, check the balance again, then settle.
  const onSwap = useCallback(
    async (from: string, to: string, amountIn: number, amountOut: number) => {
      await wait(SUBMIT_DELAY_MS);
      if ((balancesRef.current[from] ?? 0) < amountIn * (1 - 1e-9)) {
        throw new Error(`Insufficient ${from} balance`);
      }
      setBalances((prev) => ({
        ...prev,
        [from]: Math.max(0, (prev[from] ?? 0) - amountIn),
        [to]: (prev[to] ?? 0) + amountOut,
      }));
    },
    []
  );

  return (
    <main className="page">
      {tokens.status === "loading" && (
        <div className="card card--status" aria-busy="true">
          <span className="spinner spinner--lg" aria-hidden="true" />
          <p>Loading prices…</p>
        </div>
      )}
      {tokens.status === "error" && (
        <div className="card card--status" role="alert">
          <p className="status__title">Couldn’t load token prices</p>
          <p className="status__detail">{tokens.message}</p>
          <button type="button" className="submit" onClick={tokens.retry}>
            Try again
          </button>
        </div>
      )}
      {tokens.status === "ready" && (
        <SwapForm tokens={tokens.tokens} balances={balances} onSwap={onSwap} />
      )}
    </main>
  );
}
