import { Fun, Thunk, Case, Evaluate } from "../lazy.js";
import { fix, mul, traceInt } from "../prelude.js";

const factBody = Fun((f, n) =>
  Case(n, {
    [0]: () => 1,
    default: (n) => {
      const fm = Thunk(() => f(n - 1));
      return mul(n, fm);
    },
  })
);
const fact = Thunk(() => fix(factBody));

const main = Thunk(() => {
  const factN = Thunk(() => fact(10));
  return traceInt(factN);
});

Evaluate(main);
