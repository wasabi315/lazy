// A Tardis monad implementation using lazy.js

import { Thunk, Fun, Evaluate } from "../lazy.js";
import {
  Pair,
  Unit,
  undef,
  DoBuilder,
  IO,
  runIO,
  printInt,
} from "../prelude.js";

// pure x = \s -> (x, s)
const pure = Fun((x, s) => Pair(x, s));

/*
  m >>= f  = \ ~(bw, fw) -> do
    rec (x,  ~(bw'', fw' )) <- m (bw', fw)
        (x', ~(bw' , fw'')) <- (f x) (bw, fw')
    return (x', (bw'', fw''))
 */
const bind = Fun((m, f, [bw, fw]) => {
  const s1 = Thunk(() => Pair(bw1, fw));
  const [x, [bw2, fw1]] = Thunk(() => m(s1));
  const s2 = Thunk(() => Pair(bw, fw1));
  const [y, [bw1, fw2]] = Thunk(() => f(x, s2));
  const s3 = Thunk(() => Pair(bw2, fw2));
  return Pair(y, s3);
});

const TardisMonad = DoBuilder({ pure, bind });

const getPast = Fun(([bw, fw]) => {
  const s = Thunk(() => Pair(bw, fw));
  return Pair(fw, s);
});

const getFuture = Fun(([bw, fw]) => {
  const s = Thunk(() => Pair(bw, fw));
  return Pair(bw, s);
});

const sendPast = Fun((bw, [_, fw]) => {
  const s = Thunk(() => Pair(bw, fw));
  const u = Thunk(() => Unit);
  return Pair(u, s);
});

const sendFuture = Fun((fw, [bw, _]) => {
  const s = Thunk(() => Pair(bw, fw));
  const u = Thunk(() => Unit);
  return Pair(u, s);
});

const noState = Thunk(() => Pair(undef, undef));

// sendFuture 1 >>= \_ -> getPast
const ex1 = Thunk(() => {
  const m = TardisMonad.Do(function* () {
    yield Thunk(() => sendFuture(1));
    yield Thunk(() => getPast);
  });
  const [x, [_, fw]] = Thunk(() => m(noState));
  return IO.Do(function* () {
    yield Thunk(() => printInt(x));
    yield Thunk(() => printInt(fw));
  });
});

Evaluate(runIO(ex1));

// getFuture >>= \x -> sendPast 2 >>= \_ -> pure x
const ex2 = Thunk(() => {
  const m = TardisMonad.Do(function* () {
    const x = yield Thunk(() => getFuture);
    yield Thunk(() => sendPast(2));
    return x;
  });
  const [x, [bw, _]] = Thunk(() => m(noState));
  return IO.Do(function* () {
    yield Thunk(() => printInt(x));
    yield Thunk(() => printInt(bw));
  });
});

Evaluate(runIO(ex2));
