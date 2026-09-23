# Problem 2: Fancy Form

A currency swap form built with **Vite + React + TypeScript**. It has no UI library; the styling is hand-written CSS.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Features

- **Live prices** from `interview.switcheo.com/prices.json`. The feed has duplicate currencies, so I keep the latest quote per token. Tokens without a price are left out.
- **Token icons** from the Switcheo `token-icons` repo. There is an alias map for liquid-staking tokens whose file names use different casing (for example `STATOM` → `stATOM.svg`). If an icon fails to load, a lettered placeholder is shown.
- **Two-way amounts.** You can type in either "You pay" or "You receive". Only the field you type in is stored; the other field is computed from the rate, so the two never drift apart.
- **Input sanitising.** Only a valid decimal is accepted. `,` works as the decimal separator, leading zeros are removed, and there is a limit of 8 decimals.
- **Validation.** The form rejects an empty amount, a zero amount, and a balance that is too low (mock wallet). The submit button text tells you what is wrong, the field turns red, and the error is announced to screen readers.
- **Max** fills in the whole balance. It rounds down so it never goes over the balance.
- **Switch button** swaps the two tokens and keeps the typed value next to its token. Picking the token that is already on the other side swaps them instead of allowing a same-token pair.
- **Token picker** with search, keyboard navigation (↑ ↓ Enter Esc), a focus trap, and sorting by the value you hold.
- **Rate row** (click it to invert the rate) and minimum received at 0.5% slippage.
- **Mocked submission.** A spinner shows during a simulated backend delay. The balance is checked again, the mock wallet is updated, and a receipt screen is shown.
- Loading and error states (with retry) for the price feed, dark and light themes, `prefers-reduced-motion`, and a responsive layout.

## Structure

```
src/
  lib/tokens.ts        price feed normalisation, icon URLs, mock wallet
  lib/format.ts        number formatting and input sanitising
  hooks/useTokens.ts   fetch with loading, error and retry (abort on unmount)
  components/
    SwapForm.tsx       form state, derived amounts, validation, submit
    TokenPicker.tsx    searchable modal list
    TokenIcon.tsx      icon with fallback
  App.tsx              data loading and the mocked swap "backend"
```

## Assumptions

- There is no real wallet, so balances are mocked. Each token gets a stable balance worth a few thousand USD, derived from its symbol.
- Exchange rate = `price(from) / price(to)`. There are no fees.
