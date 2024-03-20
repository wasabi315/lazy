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
    toString: () => "Eval",
    exec(stacks) {
      return expr.eval(stacks);
    },
  };
}

function Call(fun, ...args) {
  return {
    toString: () => "Call",
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
    toString: () => "ReturnFun",
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
    toString: () => "ReturnCon",
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
    toString: () => "ReturnInt",
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
        uframe.target.eval = () => ReturnInt(n);
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
    self.eval = () => {
      throw new Error("Blackhole");
    };
    stacks.upd.push({ target: self, ret: stacks.ret, call: stacks.call });
    stacks.call = [];
    stacks.ret = [];
    return Eval(expr());
  };
  return self;
}

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

if (!Number.prototype.eval) {
  Number.prototype.eval = function (_stacks) {
    return ReturnInt(this);
  };
}
