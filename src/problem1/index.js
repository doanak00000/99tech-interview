/**
 * Problem 1: Three ways to sum to n
 *
 * sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15
 *
 * Assumptions:
 * - n is an integer and the result is below Number.MAX_SAFE_INTEGER (per the spec).
 * - sum_to_n(0) === 0.
 * - For negative n the sum mirrors the positive case:
 *   sum_to_n(-3) === -1 + -2 + -3 === -6.
 */

/**
 * A: Closed-form formula (Gauss). O(1) time, O(1) space.
 *
 * Halve the even factor before multiplying so the intermediate value never
 * goes above MAX_SAFE_INTEGER. n * (n + 1) can reach about 2^54 near the upper
 * bound. It happens to stay exact there because the product is always even,
 * but keeping every step in the safe range avoids depending on that detail.
 */
var sum_to_n_a = function (n) {
  const sign = Math.sign(n);
  const m = Math.abs(n);
  const result = m % 2 === 0 ? (m / 2) * (m + 1) : m * ((m + 1) / 2);
  return sign * result;
};

/**
 * B: Iterative loop. O(n) time, O(1) space.
 * Simple and obvious, but linear in n.
 */
var sum_to_n_b = function (n) {
  const sign = Math.sign(n);
  const m = Math.abs(n);
  let sum = 0;
  for (let i = 1; i <= m; i++) {
    sum += i;
  }
  return sign * sum;
};

/**
 * C: Divide-and-conquer recursion. O(n) time, O(log n) stack depth.
 *
 * Naive recursion (n + sum(n - 1)) overflows the call stack at roughly
 * n ≈ 10^4. Splitting the range in half keeps the depth logarithmic,
 * so even the largest valid n only needs about 27 frames.
 */
var sum_to_n_c = function (n) {
  const sumRange = (lo, hi) => {
    if (lo > hi) return 0;
    if (lo === hi) return lo;
    const mid = Math.floor((lo + hi) / 2);
    return sumRange(lo, mid) + sumRange(mid + 1, hi);
  };
  return Math.sign(n) * sumRange(1, Math.abs(n));
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
