// Type stubs for things the original snippet uses but does not define
// (they would come from the host codebase). Only here so the refactor type-checks.
import type { HTMLAttributes } from "react";

declare global {
  type BoxProps = HTMLAttributes<HTMLDivElement>;

  function useWalletBalances(): {
    currency: string;
    amount: number;
    blockchain: "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";
  }[];
  function usePrices(): Record<string, number>;
  function useStyles(): { row: string };

  function WalletRow(props: {
    className?: string;
    amount: number;
    usdValue: number;
    formattedAmount: string;
  }): JSX.Element;
}

export {};
