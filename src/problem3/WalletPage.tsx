import React, { useMemo } from "react";
// Assumed to exist in the host codebase, as in the original snippet:
// import { BoxProps } from "@mui/material";
// import { WalletRow } from "./WalletRow";
// import { useWalletBalances, usePrices } from "./hooks";
// import { useStyles } from "./styles";

type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface WalletRowData extends WalletBalance {
  formatted: string;
  usdValue: number;
}

type Props = BoxProps;

// Module scope: created once, not on every render.
// Partial<> lets an unknown chain from the API fall through to UNSUPPORTED.
const BLOCKCHAIN_PRIORITY: Partial<Record<string, number>> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
} satisfies Record<Blockchain, number>;

const UNSUPPORTED_PRIORITY = -99;
const AMOUNT_DECIMALS = 4;

const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? UNSUPPORTED_PRIORITY;

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const classes = useStyles();
  const balances: WalletBalance[] = useWalletBalances();
  const prices: Record<string, number> = usePrices();

  // Depends on balances only. Price updates should not trigger a re-sort.
  const sortedBalances = useMemo(
    () =>
      balances
        .map((balance) => ({ balance, priority: getPriority(balance.blockchain) }))
        .filter(({ balance, priority }) => priority > UNSUPPORTED_PRIORITY && balance.amount > 0)
        .sort((lhs, rhs) => rhs.priority - lhs.priority)
        .map(({ balance }) => balance),
    [balances]
  );

  // Formatting and USD value in one pass. Recomputed only when data changes.
  const rows = useMemo<WalletRowData[]>(
    () =>
      sortedBalances.map((balance) => ({
        ...balance,
        formatted: balance.amount.toFixed(AMOUNT_DECIMALS),
        usdValue: (prices[balance.currency] ?? 0) * balance.amount,
      })),
    [sortedBalances, prices]
  );

  return (
    <div {...rest}>
      {rows.map((row) => (
        <WalletRow
          key={`${row.blockchain}-${row.currency}`}
          className={classes.row}
          amount={row.amount}
          usdValue={row.usdValue}
          formattedAmount={row.formatted}
        />
      ))}
      {children}
    </div>
  );
};

export default WalletPage;
