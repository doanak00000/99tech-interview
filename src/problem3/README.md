# Problem 3: Messy React

The refactored component is in [`WalletPage.tsx`](./WalletPage.tsx).

`externals.d.ts` has type stubs for things the snippet uses but does not define (`BoxProps`, `WalletRow`, `useWalletBalances`, `usePrices`, `useStyles`). They let the refactor be type-checked with `npm install && npm run typecheck`.

## Assumptions

- `useWalletBalances()` returns `WalletBalance[]`, and each balance also has a `blockchain` field. The code reads it, but the interface does not declare it.
- `usePrices()` returns a `Record<string, number>` map from currency to USD price. Some currencies may have no price.
- `BoxProps`, `WalletRow`, `useWalletBalances`, `usePrices` and `classes` come from elsewhere in the codebase (MUI-style). `classes` is not defined in this snippet.
- The component should show only **non-zero** balances on **supported** chains, sorted by chain priority from highest to lowest. See issue #2 for why I read the intent this way.

---

## Issues

Grouped by severity. The first group are real bugs: the code either does not compile or does the wrong thing.

### A. Bugs (correctness)

**1. `lhsPriority` is undefined, so it throws a `ReferenceError`.**
Inside `filter`, the value is stored in `balancePriority`, but the condition checks `lhsPriority`, which does not exist in that scope. TypeScript rejects this at compile time. If it ran anyway, it would throw on the first balance.
→ Use `balancePriority`.

**2. The filter logic is inverted.**
```ts
if (balance.amount <= 0) return true;
```
This keeps only empty or negative balances and drops every balance the user actually holds. A wallet page almost certainly wants the opposite.
→ Keep balances where `priority > -99 && amount > 0`.

**3. `WalletBalance` has no `blockchain` field.**
`balance.blockchain` is a type error. The code hides this with `getPriority(blockchain: any)`, which turns off type checking exactly where a typo, such as `'Etherum'`, would silently fall through to `-99`.
→ Add `blockchain: Blockchain` to the interface, where `Blockchain` is a union of string literals.

**4. `rows` maps `sortedBalances` but treats each item as `FormattedWalletBalance`.**
`formattedBalances` is computed and never used. `rows` iterates `sortedBalances` and annotates each item as `FormattedWalletBalance`, so `balance.formatted` is always `undefined`. The annotation is a false type: TypeScript accepts it because the callback parameter type is widened, but at runtime the field is not there.
→ Build `rows` from the formatted list, or better, format while building each row in a single pass.

**5. The sort comparator returns nothing when priorities are equal.**
There is no `return 0` branch. JavaScript treats `undefined` as `0`, so it happens to work, but:
- it fails `noImplicitReturns` and the declared `number` return type
- the intent is unclear to the next reader.
→ `return getPriority(rhs.blockchain) - getPriority(lhs.blockchain);`

**6. `prices[balance.currency]` may be `undefined`, which gives `NaN`.**
A token with no price gives `usdValue = NaN`, and `WalletRow` will render that.
→ Default to `0`, or mark the value as unavailable: `prices[currency] ?? 0`.

**7. `classes` is not defined** in this component. There is no `useStyles()` call and no import.

### B. Performance and computational inefficiencies

**8. `useMemo` depends on `prices`, but the memoized code never reads it.**
The sorted list is recomputed every time prices update, and price feeds usually update often. The filter and sort never use `prices`, so this work is wasted.
→ Dependencies should be `[balances]` only.

**9. `getPriority` is created again on every render and called O(n log n) times.**
- It is defined inside the component, so each render allocates a new function. It is also a missing `useMemo` dependency, which `react-hooks/exhaustive-deps` would flag. It depends on no props or state, so it belongs at module scope.
- The comparator calls it twice per comparison, which is about 2·n·log n `switch` evaluations. The filter already computed each priority once.
→ Move it to module scope as a constant lookup table (`Record<Blockchain, number>`). Compute each balance's priority once, then filter and sort on the stored value.

**10. `formattedBalances` is dead work.**
It allocates a new array and a new object per balance on every render, and nothing reads it (see #4).

**11. `formattedBalances` and `rows` are recomputed on every render.**
Unlike `sortedBalances`, these are not memoized, so any parent re-render repeats the formatting and USD math. This is cheap for small lists. The bigger cost is that every `WalletRow` gets new props, so memoizing `WalletRow` would not help.
→ Put the derived row data in a `useMemo` that depends on `[sortedBalances, prices]`.

### C. React and TypeScript anti-patterns

**12. `key={index}`.**
Index keys break reconciliation when the list is re-sorted or filtered, which this list is. React will reuse the wrong DOM nodes and component state for different currencies.
→ Use a stable, unique key such as `` `${blockchain}-${currency}` ``.

**13. `toFixed()` with no argument rounds to 0 decimals.**
`0.5 ETH` is shown as `"1"` and `0.004 BTC` as `"0"`. For a wallet this is misleading.
→ Pass explicit precision, or use `Intl.NumberFormat` with `maximumFractionDigits`.

**14. `children` is destructured and never used.**
It is also removed from `rest`, so any children a caller passes are silently dropped. Either render it or stop destructuring it.

**15. `React.FC<Props>` plus `(props: Props)` is redundant.**
The props are typed twice. Also, `interface Props extends BoxProps {}` is an empty interface, which `@typescript-eslint/no-empty-interface` flags. Use `type Props = BoxProps`.

**16. Magic numbers and a stringly typed switch.**
`-99` stands for "unsupported chain" and is compared by value in a different place. A named constant or a `Record` lookup makes the meaning explicit and keeps the two places consistent.

**17. Mixed tabs and spaces** make the indentation inconsistent. This is a formatter or linting problem, but it makes the review harder.

---

## Summary of the refactor

| Before | After |
| --- | --- |
| `getPriority` with a `switch`, inside the component | `BLOCKCHAIN_PRIORITY` lookup table at module scope |
| Priority computed about 2·n·log n times | Computed once per balance |
| `useMemo(..., [balances, prices])` | `useMemo(..., [balances])` for sorting and `[sortedBalances, prices]` for rows |
| Filter keeps `amount <= 0` and references an undefined variable | Filter keeps supported chains with `amount > 0` |
| Unused `formattedBalances` and a false `FormattedWalletBalance` type | One pass builds typed row data |
| `key={index}` | `key={`${blockchain}-${currency}`}` |
| `toFixed()` | Explicit precision |
| `NaN` when a price is missing | `?? 0` |
