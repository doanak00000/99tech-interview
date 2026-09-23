# 99Tech Code Challenge: Frontend Submission

My solutions to the 99Tech code challenge for the **Frontend Engineer** role (Problems 1, 2 and 3).

| Problem | Folder | Summary |
| --- | --- | --- |
| 1. Three ways to sum to n | [`src/problem1`](src/problem1) | Closed-form formula, iterative loop, and divide-and-conquer recursion, with tests |
| 2. Fancy Form | [`src/problem2`](src/problem2) | Currency swap form built with Vite + React + TypeScript, using live token prices |
| 3. Messy React | [`src/problem3`](src/problem3) | Review of the computational inefficiencies and anti-patterns, plus a refactored component |

## Running the solutions

**Problem 1** (Node.js 18+)

```bash
node src/problem1/index.test.js
```

**Problem 2** (Node.js 18+)

```bash
cd src/problem2
npm install
npm run dev      # open http://localhost:5173
```

**Problem 3**: the written analysis is in [`src/problem3/README.md`](src/problem3/README.md) and the refactor is in [`WalletPage.tsx`](src/problem3/WalletPage.tsx). To type-check it:

```bash
cd src/problem3
npm install
npm run typecheck
```
