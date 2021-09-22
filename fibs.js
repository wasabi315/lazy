import { Fun, Thunk, Int, Con, Case, Evaluate } from "./lazy.js";

const zero = Thunk(() => Int(0));
const one = Thunk(() => Int(1));
const add = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Int(n + m));
    });
  });
});
const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Int(n - m));
    });
  });
});

const Nil = Con("Nil");
const Cons = (x, xs) => Con("Cons", x, xs);
const take = Fun((n, xs) => {
  return Case(
    n,
    {
      [0]: () => Nil,
    },
    () => {
      return Case(xs, {
        Nil: () => Nil,
        Cons: (x, xs) => {
          const m = Thunk(() => sub(n, one));
          const ys = Thunk(() => take(m, xs));
          return Cons(x, ys);
        },
      });
    }
  );
});
const zipWith = Fun((f, xs, ys) => {
  return Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) => {
      return Case(ys, {
        Nil: () => Nil,
        Cons: (y, ys) => {
          const z = Thunk(() => f(x, y));
          const zs = Thunk(() => zipWith(f, xs, ys));
          return Cons(z, zs);
        },
      });
    },
  });
});
const tail = Fun((xs) => {
  return Case(xs, {
    Cons: (_, xs) => xs,
  });
});

const Unit = Con("Unit");
const pure = Fun((x) => x);
const then = Fun((x, y) => {
  Evaluate(x);
  return Evaluate(y);
});

const printInt = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return pure(Unit);
  });
});
const traverse_ = Fun((f, xs) => {
  return Case(xs, {
    Nil: () => Thunk(() => pure(Unit)),
    Cons: (x, xs) => {
      const fx = Thunk(() => f(x));
      const tfxs = Thunk(() => traverse_(f, xs));
      return then(fx, tfxs);
    },
  });
});

const fibs = Thunk(() => {
  const _fibs = Thunk(() => tail(fibs));
  const xs = Thunk(() => zipWith(add, fibs, _fibs));
  const ys = Thunk(() => Cons(one, xs));
  return Cons(zero, ys);
});

const main = Thunk(() => {
  const n = Thunk(() => Int(100));
  const fs = Thunk(() => take(n, fibs));
  return traverse_(printInt, fs);
});

Evaluate(main);
