// A Tardis monad implementation using lazy.js

import { Thunk, Fun, Evaluate } from "../lazy.js";
import { Pair, Unit, undef, traceInt, seq } from "../prelude.js";

// pure x = \s -> (x, s)
const pure = Fun((x, s) => Pair(x, s));

/*
  m >>= f  = \ ~(bw, fw) -> do
    rec (x,  ~(bw'', fw' )) <- m (bw', fw)
        (x', ~(bw' , fw'')) <- (f x) (bw, fw')
    return (x', (bw'', fw''))
 */
const bind = Fun((m, f, [bw, fw]) => {
  const [[x, [bw2, fw1]], [y, [bw1, fw2]]] = Thunk(() => {
    const s1 = Thunk(() => Pair(bw1, fw));
    const m1 = Thunk(() => m(s1));
    const s2 = Thunk(() => Pair(bw, fw1));
    const m2 = Thunk(() => f(x, s2));
    return Pair(m1, m2);
  });
  const s = Thunk(() => Pair(bw2, fw2));
  return Pair(y, s);
});

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
  const m1 = Thunk(() => sendFuture(1));
  const k1 = Fun((_) => getPast);
  const m2 = Thunk(() => bind(m1, k1));
  const [x, [_, fw]] = Thunk(() => m2(noState));
  const t1 = Thunk(() => traceInt(x));
  const t2 = Thunk(() => traceInt(fw));
  return seq(t1, t2);
});

Evaluate(ex1);

// getFuture >>= \x -> sendPast 1 >>= \_ -> pure x
const ex2 = Thunk(() => {
  const m1 = Thunk(() => getFuture);
  const k1 = Fun((x) => {
    const m2 = Thunk(() => sendPast(2));
    const k2 = Fun((_) => pure(x));
    return bind(m2, k2);
  });
  const m3 = Thunk(() => bind(m1, k1));
  const [x, [bw, _]] = Thunk(() => m3(noState));
  const t1 = Thunk(() => traceInt(x));
  const t2 = Thunk(() => traceInt(bw));
  return seq(t1, t2);
});

Evaluate(ex2);
