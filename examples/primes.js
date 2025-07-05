import { Fun, Thunk, Case, Evaluate } from "../lazy.js";
import {
  filter,
  doesNotdivide,
  take,
  enumFrom,
  Cons,
  traverseList_,
  IO,
  runIO,
  printInt,
} from "../prelude.js";

const filterPrime = Fun((xs) => {
  return Case(xs, {
    Cons: (p, xs) => {
      const pred = Thunk(() => doesNotdivide(p));
      const ys = Thunk(() => filter(pred, xs));
      const ps = Thunk(() => filterPrime(ys));
      return Cons(p, ps);
    },
  });
});
const primes = Thunk(() => {
  const fromTwo = Thunk(() => enumFrom(2));
  return filterPrime(fromTwo);
});

const main = Thunk(() => {
  const ns = Thunk(() => take(5000, primes));
  return traverseList_(IO)(printInt, ns);
});

Evaluate(runIO(main));
