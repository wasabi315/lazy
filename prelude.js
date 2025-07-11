import { Fun, Case, Thunk, Con } from "./lazy.js";

// Unit
export const Unit = Con("Unit");

// Boolean
export const True = Con("True");
export const False = Con("False");
export const not = Fun((b) =>
  Case(b, {
    True: () => False,
    False: () => True,
  })
);
export const ifThenElse = Fun((b, t, f) =>
  Case(b, {
    True: () => t,
    False: () => f,
  })
);

// Pair
export const Pair = (x, y) => Con("Pair", x, y);
export const fst = Fun((p) => Case(p, { Pair: (x, _) => x }));
export const snd = Fun((p) => Case(p, { Pair: (_, y) => y }));

// trace
export const traceInt = Fun((x) =>
  Case(x, {
    default: (n) => {
      console.log(n);
      return n;
    },
  })
);

// Basic functions
export const fix = Fun((f) => {
  const x = Thunk(() => f(x));
  return x;
});

export const flip = Fun((f, x, y) => f(y, x));

// Arithmetic
export const add = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => n + m,
      }),
  })
);
export const sub = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => n - m,
      }),
  })
);
export const mul = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => n * m,
      }),
  })
);
export const div = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => Math.floor(n / m),
      }),
  })
);
export const divides = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => (m % n === 0 ? True : False),
      }),
  })
);
export const doesNotdivide = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => (m % n === 0 ? False : True),
      }),
  })
);
export const lte = Fun((x, y) =>
  Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => (n <= m ? True : False),
      }),
  })
);
export const min = Fun((x, y) =>
  Case(x, {
    default: (m) =>
      Case(y, {
        default: (n) => (m < n ? m : n),
      }),
  })
);

// Lists

export const Nil = Con("Nil");
export const Cons = (x, xs) => Con("Cons", x, xs);

export const tail = Fun((xs) => Case(xs, { Cons: (_, xs) => xs }));
export const take = Fun((n, xs) =>
  Case(n, {
    [0]: () => Nil,
    default: () =>
      Case(xs, {
        Nil: () => Nil,
        Cons: (x, xs) => {
          const m = Thunk(() => sub(n, 1));
          const ys = Thunk(() => take(m, xs));
          return Cons(x, ys);
        },
      }),
  })
);
export const map = Fun((f, xs) =>
  Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) => {
      const y = Thunk(() => f(x));
      const ys = Thunk(() => map(f, xs));
      return Cons(y, ys);
    },
  })
);
export const zipWith = Fun((f, xs, ys) =>
  Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) =>
      Case(ys, {
        Nil: () => Nil,
        Cons: (y, ys) => {
          const z = Thunk(() => f(x, y));
          const zs = Thunk(() => zipWith(f, xs, ys));
          return Cons(z, zs);
        },
      }),
  })
);
export const filter = Fun((p, xs) =>
  Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) =>
      Case(p(x), {
        True: () => {
          const ys = Thunk(() => filter(p, xs));
          return Cons(x, ys);
        },
        False: () => filter(p, xs),
      }),
  })
);
export const enumFrom = Fun((n) => {
  const m = Thunk(() => add(n, 1));
  const ns = Thunk(() => enumFrom(m));
  return Cons(n, ns);
});
export const traverseList_ = (monad) =>
  Fun((f, xs) => {
    return Case(xs, {
      Nil: () => {
        const u = Thunk(() => Unit);
        return monad.pure(u);
      },
      Cons: (x, xs) => {
        const y = Thunk(() => f(x));
        const k = Fun((_) => traverseList_(monad)(f, xs));
        return monad.bind(y, k);
      },
    });
  });

// force
export const seq = Fun((x, y) => Case(x, { default: () => y }));
export const rnfList = Fun((xs) =>
  Case(xs, {
    Nil: () => Unit,
    Cons: (x, xs) => {
      const y = Thunk(() => rnfList(xs));
      return seq(x, y);
    },
  })
);

// undefined
export const undef = Thunk(() => {
  throw new Error("undef");
});

// Qualified Do
export function MonadBuilder({ pure, bind }) {
  function aux(it, prev) {
    const { done, value } = it.next(prev);
    if (done) {
      return pure(value);
    }
    const k = Fun((x) => aux(it, x));
    return bind(value, k);
  }
  return {
    Do(gen) {
      return Thunk(() => aux(gen()));
    },
    pure,
    bind,
  };
}

// IO Monad
const io_pure = Fun((x, s) => Pair(x, s));
const io_bind = Fun((m, f, s) =>
  Case(m(s), {
    Pair: (x, s1) => f(x, s1),
  })
);
export const IO = MonadBuilder({ pure: io_pure, bind: io_bind });
export const runIO = Fun((m) => {
  return Case(m(Unit), {
    Pair: (x, _) => x,
  });
});

export const printInt = Fun((n, s) =>
  Case(s, {
    Unit: () =>
      Case(n, {
        default: (n) => {
          console.log(n);
          return Pair(Unit, Unit);
        },
      }),
  })
);
