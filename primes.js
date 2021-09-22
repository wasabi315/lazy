import { Fun, Thunk, Raw, Con, Case, Evaluate } from "./lazy.js";

const flip = Fun((f, x, y) => f(y, x));

const True = Con("True");
const False = Con("False");

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

const Nil = () => Con("Nil");
const Cons = (x, xs) => Con("Cons", x, xs);
const filter = Fun((f, xs) => {
  return Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) => {
      return Case(f(x), {
        True: () => {
          const ffxs = Thunk(() => filter(f, xs));
          return Cons(x, ffxs);
        },
        False: () => filter(f, xs),
      });
    },
  });
});
const enumFrom = Fun((x) => {
  const one = Thunk(() => Raw(1));
  const y = Thunk(() => add(x, one));
  const xs = Thunk(() => enumFrom(y));
  return Cons(x, xs);
});
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
          const one = Thunk(() => Raw(1));
          const m = Thunk(() => sub(n, one));
          const ys = Thunk(() => take(m, xs));
          return Cons(x, ys);
        },
      });
    }
  );
});

const Unit = Con("Unit");
const pure = Fun((x) => x);
const then = Fun((x, y) => {
  Evaluate(x);
  return Evaluate(y);
});

const printRaw = Fun((x) => {
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

const primes = Thunk(() => {
  const filterPrime = Fun((xs) => {
    return Case(xs, {
      Cons: (p, xs) => {
        const pred = Thunk(() => flip(isNotDivisible, p));
        const ys = Thunk(() => filter(pred, xs));
        const ps = Thunk(() => filterPrime(ys));
        return Cons(p, ps);
      },
    });
  });
  const two = Thunk(() => Raw(2));
  const fromTwo = Thunk(() => enumFrom(two));
  return filterPrime(fromTwo);
});

const main = Thunk(() => {
  const n = Thunk(() => Raw(100));
  const fs = Thunk(() => take(n, primes));
  return traverse_(printRaw, fs);
});

Evaluate(main);
