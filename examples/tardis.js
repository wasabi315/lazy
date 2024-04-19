// A Tardis monad implementation using lazy.js

import { Thunk, Fun, Evaluate } from "../lazy.js";
import { Pair, Unit, undef, traceInt, seq, DoBuilder } from "../prelude.js";

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
    const _ = yield Thunk(() => sendFuture(1));
    const x = yield Thunk(() => getPast);
    return x;
  });
  const [x, [_, fw]] = Thunk(() => m(noState));
  const t1 = Thunk(() => traceInt(x));
  const t2 = Thunk(() => traceInt(fw));
  return seq(t1, t2);
});

Evaluate(ex1);

// getFuture >>= \x -> sendPast 1 >>= \_ -> pure x
const ex2 = Thunk(() => {
  const m = TardisMonad.Do(function* () {
    const x = yield Thunk(() => getFuture);
    const _ = yield Thunk(() => sendPast(2));
    return x;
  });
  const [x, [bw, _]] = Thunk(() => m(noState));
  const t1 = Thunk(() => traceInt(x));
  const t2 = Thunk(() => traceInt(bw));
  return seq(t1, t2);
});

Evaluate(ex2);
