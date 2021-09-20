import { Fun, Thunk, Raw, Con, Case, Evaluate } from "./lazy.js";

const flip = Fun((f, x, y) => f(y, x));

const True = Thunk(() => Con("True"));
const False = Thunk(() => Con("False"));

const Num = (n) => Thunk(() => Raw(n));
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
const isNotDivisible = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return n % m !== 0 ? True : False;
    });
  });
});

const nil = Thunk(() => Con("nil"));
const cons = (x, xs) => Con("cons", x, xs);
const filter = Fun((f, xs) => {
  return Case(xs, {
    nil: () => nil,
    cons: (x, xs) => {
      return Case(f(x), {
        True: () => {
          const ffxs = Thunk(() => filter(f, xs));
          return cons(x, ffxs);
        },
        False: () => filter(f, xs),
      });
    },
  });
});
const enumFrom = Fun((x) => {
  const y = Thunk(() => add(x, Num(1)));
  const xs = Thunk(() => enumFrom(y));
  return cons(x, xs);
});
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
          const m = Thunk(() => sub(n, Num(1)));
          const ys = Thunk(() => take(m, xs));
          return cons(x, ys);
        },
      });
    }
  );
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

const primes = Thunk(() => {
  const filterPrime = Fun((xs) => {
    return Case(xs, {
      cons: (p, xs) => {
        const pred = Thunk(() => flip(isNotDivisible, p));
        const ys = Thunk(() => filter(pred, xs));
        const ps = Thunk(() => filterPrime(ys));
        return cons(p, ps);
      },
    });
  });
  const fromTwo = Thunk(() => enumFrom(Num(2)));
  return filterPrime(fromTwo);
});

Evaluate(
  traverse_(
    printRaw,
    take(
      Thunk(() => Raw(500)),
      primes
    )
  )
);
