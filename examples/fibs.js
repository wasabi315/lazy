import { Evaluate, Thunk } from "../lazy.js";
import {
  zipWith,
  add,
  tail,
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
  const ns = Thunk(() => map(traceInt, fibs));
  return rnfList(ns);
});

Evaluate(main);
