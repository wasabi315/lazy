import { Evaluate, Thunk } from "../lazy.js";
import {
  zipWith,
  add,
  tail,
  take,
  Cons,
  map,
  rnfList,
  traceInt,
} from "../prelude.js";

const fibs = Thunk(() => {
  const xs = Thunk(() => tail(fibs));
  const ys = Thunk(() => zipWith(add, fibs, xs));
  const zs = Thunk(() => Cons(1n, ys));
  return Cons(0n, zs);
});

const main = Thunk(() => {
  const xs = Thunk(() => take(200, fibs));
  const ys = Thunk(() => map(traceInt, xs));
  return rnfList(ys);
});

Evaluate(main);
