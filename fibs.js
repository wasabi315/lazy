import { Fun, Thunk, Raw, Con, Case, Evaluate } from "./lazy.js";

const zero = Thunk(() => Raw(0));
const one = Thunk(() => Raw(1));
const add = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Raw(n + m));
    });
  });
});
const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Raw(n - m));
    });
  });
});

const nil = Thunk(() => Con("nil"));
const cons = (x, xs) => Con("cons", x, xs);
const take = Fun((n, xs) => {
  return Case(
    n,
    {
      [0]: () => nil,
    },
    () => {
      return Case(xs, {
        nil: () => nil,
        cons: (x, xs) => {
          const m = Thunk(() => sub(n, one));
          const ys = Thunk(() => take(m, xs));
          return cons(x, ys);
        },
      });
    }
  );
});
const zipWith = Fun((f, xs, ys) => {
  return Case(xs, {
    nil: () => nil,
    cons: (x, xs) => {
      return Case(ys, {
        nil: () => nil,
        cons: (y, ys) => {
          const z = Thunk(() => f(x, y));
          const zs = Thunk(() => zipWith(f, xs, ys));
          return cons(z, zs);
        },
      });
    },
  });
});
const tail = Fun((xs) => {
  return Case(xs, {
    cons: (_, xs) => xs,
  });
});

const unit = Thunk(() => Con("unit"));
const pure = Fun((x) => x);
const then = Fun((x, y) => {
  Evaluate(x);
  return Evaluate(y);
});

const printRaw = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return unit;
  });
});
const traverse_ = Fun((f, xs) => {
  return Case(xs, {
    nil: () => Thunk(() => pure(unit)),
    cons: (x, xs) => {
      const fx = Thunk(() => f(x));
      const tfxs = Thunk(() => traverse_(f, xs));
      return then(fx, tfxs);
    },
  });
});

const fibs = Thunk(() => {
  const _fibs = Thunk(() => tail(fibs));
  const xs = Thunk(() => zipWith(add, fibs, _fibs));
  const ys = Thunk(() => cons(one, xs));
  return cons(zero, ys);
});

Evaluate(
  traverse_(
    printRaw,
    take(
      Thunk(() => Raw(100)),
      fibs
    )
  )
);
