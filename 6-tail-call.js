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
        const pap = (...args2) => App(Fun(fun), ...args, ...args2);
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
        uframe.addr.eval = Fun(fun).eval;
        return ReturnFun(fun);
      }
    },
  };
}

function ReturnCon(con, ...args) {
  return {
    exec(stacks) {
      const rframe = stacks.ret.pop();
      if (rframe) {
        const alt = rframe.alts[con];
        if (alt) {
          return Eval(alt(...args));
        }
        if (rframe.def) {
          const x = Thunk(() => Con(con, ...args));
          return Eval(rframe.def(x));
        }
        throw new Error("No matched alternatives");
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.addr.eval = Con(con, ...args).eval;
        return ReturnCon(con, ...args);
      }
    },
  };
}

function ReturnInt(n) {
  return {
    exec(stacks) {
      const rframe = stacks.ret.pop();
      if (rframe) {
        const alt = rframe.alts[n];
        if (alt) {
          return Eval(alt());
        }
        if (rframe.def) {
          return Eval(rframe.def(n));
        }
        throw new Error("No matched alternatives");
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.addr.eval = Int(n).eval;
        return ReturnInt(n);
      }
    },
  };
}

export function Thunk(expr) {
  const self = {
    eval(stacks) {
      self.eval = Blackhole.eval;
      stacks.upd.push({ addr: self, ret: stacks.ret, call: stacks.call });
      stacks.call = [];
      stacks.ret = [];
      return Eval(expr());
    },
  };
  return self;
}

const Blackhole = {
  eval() {
    throw new Error("Blackhole");
  },
};

export function Case(x, alts, def) {
  return {
    eval(stacks) {
      stacks.ret.push({ alts, def });
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
  return {
    eval(_stacks) {
      return ReturnFun(fun);
    },
  };
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
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Int(n + m);
    });
  });
});
const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Int(n - m);
    });
  });
});
const mul = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Int(n * m);
    });
  });
});

const Cons = (x, xs) => Con("Cons", x, xs);
const Nil = Con("Nil");
const tail = Fun((xs) => {
  return Case(xs, {
    Cons: (_, xs) => xs,
  });
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
          const m = Thunk(() => App(sub, n, Int(1)));
          const tmxs = Thunk(() => App(take, m, xs));
          return Cons(x, tmxs);
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
          const fxy = Thunk(() => App(f, x, y));
          const zfxsys = Thunk(() => App(zipWith, f, xs, ys));
          return Cons(fxy, zfxsys);
        },
      });
    },
  });
});

const Unit = Con("Unit");
const then = Fun((x, y) => {
  return Case(x, {}, () => {
    return Case(y, {}, (y) => y);
  });
});
const traverse_ = Fun((f, xs) => {
  return Case(xs, {
    Nil: () => Unit,
    Cons: (x, xs) => {
      const fx = Thunk(() => App(f, x));
      const tfxs = Thunk(() => App(traverse_, f, xs));
      return App(then, fx, tfxs);
    },
  });
});
const printInt = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return Unit;
  });
});

const fibs = Thunk(() => {
  const xs = Thunk(() => App(tail, fibs));
  const ys = Thunk(() => App(zipWith, add, fibs, xs));
  const zs = Thunk(() => Cons(Int(1), ys));
  return Cons(Int(0), zs);
});

const fix = Fun((f) => {
  const x = Thunk(() => App(f, x));
  return x;
});
const fact_ = Fun((f, n) => {
  return Case(
    n,
    {
      [0]: () => Int(1),
    },
    () => {
      const m = Thunk(() => App(sub, n, Int(1)));
      const fm = Thunk(() => App(f, m));
      return App(mul, n, fm);
    }
  );
});
const fact = Thunk(() => App(fix, fact_));

const main = Thunk(() => {
  const n = Thunk(() => Int(100));
  const fs = Thunk(() => App(take, n, fibs));
  return App(traverse_, printInt, fs);
});

Evaluate(main);
