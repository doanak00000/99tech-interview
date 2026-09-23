import { useCallback, useEffect, useState } from "react";
import { fetchTokens, type Token } from "../lib/tokens";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tokens: Token[] };

export function useTokens() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchTokens(controller.signal)
      .then((tokens) => setState({ status: "ready", tokens }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not load prices",
        });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
