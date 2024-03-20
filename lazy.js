export function Evaluate(expr) {
  const stacks = {
    call: [],
    ret: [],
    upd: [],
  };
  let code = Eval(expr);
  try {
    while ((code = code.exec(stacks)));
  } catch (err) {
    throw new Error("Evaluation error", { cause: err });
  }
}

/******************************************************************************/
// Codes

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
        uframe.target.eval = () => ReturnInt(n);
        return ReturnInt(n);
      }
    },
  };
}

/******************************************************************************/
// Terms: things that can be evaluated

export function Thunk(expr) {
  self.eval = (stacks) => {
    self.eval = () => {
      throw new Error("Blackhole");
    };
    stacks.upd.push({ target: self, ret: stacks.ret, call: stacks.call });
    stacks.call = [];
    stacks.ret = [];
    return Eval(expr());
  };
  function self(...args) {
    return App(self, ...args);
  }
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
  self.eval = (_stacks) => ReturnFun(fun);
  function self(...args) {
    return App(self, ...args);
  }
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
