import { Evaluate, Thunk } from "../lazy.js";
import {
  zipWith,
  add,
  tail,
  take,
  Cons,
  map,
  forceList,
  traceInt,
} from "../prelude.js";

const fibs = Thunk(() => {
  const xs = Thunk(() => tail(fibs));
  const ys = Thunk(() => zipWith(add, fibs, xs));
  const zs = Thunk(() => Cons(1, ys));
  return Cons(0, zs);
});

const main = Thunk(() => {
  const xs = Thunk(() => take(1000, fibs));
  const ys = Thunk(() => map(traceInt, xs));
  return forceList(ys);
});

Evaluate(main);
