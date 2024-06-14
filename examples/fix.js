import { Fun, Thunk, Case, Evaluate } from "../lazy.js";
import { fix, mul, printInt, runIO } from "../prelude.js";

const factBody = Fun((f, n) =>
  Case(n, {
    [0n]: () => 1n,
    default: (n) => {
      const fm = Thunk(() => f(n - 1n));
      return mul(n, fm);
    },
  })
);
const fact = Thunk(() => fix(factBody));

const main = Thunk(() => {
  const factN = Thunk(() => fact(1000n));
  return printInt(factN);
});

Evaluate(runIO(main));
