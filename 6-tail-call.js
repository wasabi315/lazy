export function Evaluate(expr) {
  const stacks = {
    call: [],
    ret: [],
    upd: [],
  };
  let code = Eval(expr);
  while ((code = code.exec(stacks)));
}

function Eval(expr) {
  return {
    exec(stacks) {
      return expr.eval(stacks);
    },
  };
}

function Call(fun, ...args) {
  return {
    exec(stacks) {
      const arity = fun.length;
      const nargs = args.length;
      if (arity === nargs) {
        return Eval(fun(...args));
      }
      if (arity > nargs) {
        const pap = (...args2) => Fun(fun)(...args, ...args2);
        Object.defineProperty(pap, "length", { value: arity - nargs });
        return Eval(Fun(pap));
      }
      stacks.call.push((f) => Call(f, ...args.slice(arity)));
      return Eval(fun(...args.slice(0, arity)));
    },
  };
}

function ReturnFun(fun) {
  return {
    exec(stacks) {
      const callCont = stacks.call.pop();
      if (callCont) {
        return callCont(fun);
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.target.eval = Fun(fun).eval;
        return ReturnFun(fun);
      }
    },
  };
}

function ReturnCon(con, ...args) {
  return {
    exec(stacks) {
      const alts = stacks.ret.pop();
      if (alts) {
        const alt = alts[con];
        if (alt) {
          return Eval(alt(...args));
        }
        const def = alts.default;
        if (def) {
          const x = Thunk(() => Con(con, ...args));
          return Eval(def(x));
        }
        throw new Error("No matched alternatives");
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.target.eval = Con(con, ...args).eval;
        return ReturnCon(con, ...args);
      }
    },
  };
}

function ReturnInt(n) {
  return {
    exec(stacks) {
      const alts = stacks.ret.pop();
      if (alts) {
        const alt = alts[n];
        if (alt) {
          return Eval(alt());
        }
        const def = alts.default;
        if (def) {
          return Eval(def(n));
        }
        throw new Error("No matched alternatives");
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.target.eval = Int(n).eval;
        return ReturnInt(n);
      }
    },
  };
}

export function Thunk(expr) {
  function self(...args) {
    return App(self, ...args);
  }
  self.eval = (stacks) => {
    self.eval = Blackhole.eval;
    stacks.upd.push({ target: self, ret: stacks.ret, call: stacks.call });
    stacks.call = [];
    stacks.ret = [];
    return Eval(expr());
  };
  return self;
}

const Blackhole = {
  eval(_stacks) {
    throw new Error("Blackhole");
  },
};

export function Case(x, alts) {
  return {
    eval(stacks) {
      stacks.ret.push(alts);
      return Eval(x);
    },
  };
}

export function App(fun, ...args) {
  return {
    eval(stacks) {
      stacks.call.push((f) => Call(f, ...args));
      return Eval(fun);
    },
  };
}

export function Fun(fun) {
  function self(...args) {
    return App(self, ...args);
  }
  self.eval = (_stacks) => ReturnFun(fun);
  return self;
}

export function Con(con, ...args) {
  return {
    eval(_stacks) {
      return ReturnCon(con, ...args);
    },
  };
}

export function Int(n) {
  return {
    eval(_stacks) {
      return ReturnInt(n);
    },
  };
}

const add = Fun((x, y) => {
  return Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => Int(n + m),
      }),
  });
});
const sub = Fun((x, y) => {
  return Case(x, {
    default: (n) =>
      Case(y, {
        default: (m) => Int(n - m),
      }),
  });
});

const Cons = (x, xs) => Con("Cons", x, xs);
const Nil = Con("Nil");
const tail = Fun((xs) => Case(xs, { Cons: (_, xs) => xs }));
const take = Fun((n, xs) => {
  return Case(n, {
    [0]: () => Nil,
    default: () =>
      Case(xs, {
        Nil: () => Nil,
        Cons: (x, xs) => {
          const m = Thunk(() => sub(n, Int(1)));
          const tmxs = Thunk(() => take(m, xs));
          return Cons(x, tmxs);
        },
      }),
  });
});
const zipWith = Fun((f, xs, ys) => {
  return Case(xs, {
    Nil: () => Nil,
    Cons: (x, xs) =>
      Case(ys, {
        Nil: () => Nil,
        Cons: (y, ys) => {
          const fxy = Thunk(() => f(x, y));
          const zfxsys = Thunk(() => zipWith(f, xs, ys));
          return Cons(fxy, zfxsys);
        },
      }),
  });
});

const Unit = Con("Unit");
const seq = Fun((x, y) => Case(x, { default: () => y }));
const traverse_ = Fun((f, xs) =>
  Case(xs, {
    Nil: () => Unit,
    Cons: (x, xs) => {
      const fx = Thunk(() => f(x));
      const tfxs = Thunk(() => traverse_(f, xs));
      return seq(fx, tfxs);
    },
  })
);
const printInt = Fun((x) =>
  Case(x, {
    default: (n) => {
      console.log(n);
      return Unit;
    },
  })
);

const fibs = Thunk(() => {
  const xs = Thunk(() => tail(fibs));
  const ys = Thunk(() => zipWith(add, fibs, xs));
  const zs = Thunk(() => Cons(Int(1), ys));
  return Cons(Int(0), zs);
});

const main = Thunk(() => {
  const n = Thunk(() => Int(100));
  const fs = Thunk(() => take(n, fibs));
  return traverse_(printInt, fs);
});

Evaluate(main);
