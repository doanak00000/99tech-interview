const assert = require("node:assert");
const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require("./index");

const cases = [
  [0, 0], [1, 1], [5, 15], [10, 55], [100, 5050], [-3, -6], [-1, -1],
];
for (const fn of [sum_to_n_a, sum_to_n_b, sum_to_n_c]) {
  for (const [n, expected] of cases) {
    assert.strictEqual(fn(n), expected, `${fn.name}(${n})`);
  }
}

// Largest n whose sum stays under MAX_SAFE_INTEGER: n(n+1)/2 <= 2^53 - 1
const big = 134217727;
const expectedBig = Number((BigInt(big) * BigInt(big + 1)) / 2n);
assert.strictEqual(sum_to_n_a(big), expectedBig, "a big");
assert.strictEqual(sum_to_n_b(big), expectedBig, "b big");
assert.strictEqual(sum_to_n_c(big), expectedBig, "c big");

console.log("All tests passed");
