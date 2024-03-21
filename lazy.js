export function Evaluate(expr) {
  const stacks = {
    args: [],
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
      stacks.args.push(args.slice(arity));
      return Eval(fun(...args.slice(0, arity)));
    },
  };
}

function ReturnFun(fun) {
  return {
    exec(stacks) {
      const args = stacks.args.pop();
      if (args) {
        return Call(fun, ...args);
      }
      const uframe = stacks.upd.pop();
      if (uframe) {
        [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
        Object.assign(uframe.target, Fun(fun));
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
        [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
        Object.assign(uframe.target, Con(con, ...args));
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
        [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
        Object.assign(uframe.target, Int(n));
        return ReturnInt(n);
      }
    },
  };
}

/******************************************************************************/
// Expressions: things that can be evaluated

export function Thunk(expr) {
  self.eval = (stacks) => {
    self.eval = () => {
      throw new Error("Blackhole");
    };
    stacks.upd.push({ target: self, ret: stacks.ret, args: stacks.args });
    stacks.args = [];
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
      stacks.args.push(args);
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

export function Int(n) {
  return {
    eval(_stacks) {
      return ReturnInt(n);
    },
  };
}

if (!Number.prototype.eval) {
  Number.prototype.eval = function (_stacks) {
    return ReturnInt(this);
  };
}
