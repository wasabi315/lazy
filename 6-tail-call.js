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
      return expr?.eval?.(stacks);
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

export function Fun(f) {
  const arity = f.length;
  const self = {
    eval(stacks) {
      const callK = stacks.call.pop();
      if (callK) {
        return Eval(callK(self));
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        stacks.ret = uframe.ret;
        stacks.call = uframe.call;
        uframe.addr.eval = self.eval;
      }
      return Eval(self);
    },
    app(stacks, ...args) {
      const nargs = args.length;
      if (arity === nargs) {
        return Eval(f(...args));
      }
      if (arity > nargs) {
        const pap = (...args2) => App(self, ...args, ...args2);
        Object.defineProperty(pap, "length", { value: arity - nargs });
        return Eval(Fun(pap));
      }
      stacks.call.push((f) => App(f, ...args.slice(arity)));
      return Eval(f(...args.slice(0, arity)));
    },
  };
  return self;
}

export function Thunk(f) {
  const self = {
    eval(stacks) {
      self.eval = () => {
        throw new Error("Blackhole");
      };
      stacks.upd.push({ addr: self, ret: stacks.ret, call: stacks.call });
      stacks.call = [];
      stacks.ret = [];
      return Eval(f());
    },
    app(stacks, ...args) {
      stacks.call.push((f) => App(f, ...args));
      return Eval(self);
    },
  };
  return self;
}

export function Case(x, alts, def) {
  return {
    eval(stacks) {
      stacks.ret.push({ alts, def });
      return Eval(x);
    },
  };
}

export function App(f, ...args) {
  return {
    eval(stacks) {
      return f.app(stacks, ...args);
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

const const_ = Fun((x, _) => x);
const printInt = Fun((x) => Case(x, {}, (n) => console.log(n)));

const main = Thunk(() => {
  const n = Thunk(() => Int(1));
  const n2 = Thunk(() => App(const_, const_, const_, n, n));
  return App(printInt, n2);
});

Evaluate(main);
