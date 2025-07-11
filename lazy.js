// This is the entry point for the lazy evaluation engine
export function Evaluate(expr) {
  for (const _ of EvaluateGen(expr));
}

export function* EvaluateGen(expr) {
  const stacks = { args: [], ret: [], upd: [] };
  for (let code = Eval(expr); code; code = code(stacks)) {
    yield;
  }
}

/******************************************************************************/
// Expressions
// This is the API for constructing expressions
// Each expression has an eval method which is going to be called during evaluation

// Function application
export function App(fun, ...args) {
  return {
    eval: (stacks) => {
      // Push arguments to the stack first
      // Going to be applied to the function after the function is evaluated
      stacks.args.push(args);
      // Go evaluate the function then
      return Eval(fun);
    },
  };
}

export function Fun(fun) {
  // Go apply the function to the arguments on the stack
  self.eval = (_stacks) => ReturnFun(fun);
  // Shorthand for function application
  // Without this, one would have to write `App(Fun(f), ...args)`
  function self(...args) {
    return App(self, ...args);
  }
  return self;
}

export function Case(x, alts) {
  return {
    eval: (stacks) => {
      // Push alternatives to the stack
      stacks.ret.push(alts);
      // Go evaluate the scrutinee
      return Eval(x);
    },
  };
}

// Saturated constructor application
export function Con(con, ...args) {
  return {
    // Go jump to one of the alternatives on the stack
    eval: (_stacks) => ReturnCon(con, ...args),
  };
}

export function Int(n) {
  return {
    eval: (_stacks) => ReturnInt(n),
  };
}

// Corresponds to the `let` construct in STG
export function Thunk(expr) {
  // This is going to be replaced with the result after the first evaluation (memoization)
  self.eval = (stacks) => {
    // Replace the thunk with Blackhole to detect infinite loops during evaluation
    Object.assign(self, Blackhole);
    // Push a new update frame to the stack
    stacks.upd.push({ target: self, ret: stacks.ret, args: stacks.args });
    [stacks.args, stacks.ret] = [[], []];
    // Go evaluate the expression
    return Eval(expr());
  };

  // Shorthand for function application as well
  function self(...args) {
    return App(self, ...args);
  }

  // This allows destructuring bindings like `const [x, y] = Thunk(() => Pair(1, 2))`
  self[Symbol.iterator] = function* () {
    for (let i = 0; ; i++) {
      yield Thunk(() => Case(self, getAlts(i)));
    }
  };

  return self;
}

function createAlts(i) {
  return new Proxy({ i }, altHandler);
}

const altHandler = {
  get(target, _prop, _receiver) {
    return (...args) => args[target.i];
  },
};

// Allocate some alts for the first 5 cases before they are needed
const globalAlts = Array.from({ length: 5 }, (_, i) => createAlts(i));

function getAlts(i) {
  let alts = globalAlts[i];
  if (!alts) {
    alts = createAlts(i);
    globalAlts[i] = alts;
  }
  return alts;
}

const Blackhole = {
  eval: (_stacks) => {
    throw new Error("Blackhole");
  },
};

/******************************************************************************/
// Codes

// Evaluate an expression
function Eval(expr) {
  // Special case for numbers and bigints
  if (typeof expr === "number" || typeof expr === "bigint") {
    return ReturnInt(expr);
  }
  // Just delegate to the eval method of the expression otherwise
  return expr.eval;
}

// Call a function with arguments
function Call(fun, ...args) {
  return (stacks) => {
    const arity = fun.length;
    const nargs = args.length;
    // Exact application
    if (arity === nargs) {
      return Eval(fun(...args));
    }
    // Partial application
    if (arity > nargs) {
      // Create a partial application object
      const pap = Fun(fun).bind(null, ...args);
      Object.defineProperty(pap, "length", { value: arity - nargs });
      // ReturnFun, which may lead to further applications or thunk updates
      return ReturnFun(pap);
    }
    // Over-saturated application
    // Push the remaining arguments to the stack
    stacks.args.push(args.slice(arity));
    return Eval(fun(...args.slice(0, arity)));
  };
}

// Apply a function to the arguments on the stack
function ReturnFun(fun) {
  if (fun.memo) {
    return fun.memo;
  }
  return (fun.memo = (stacks) => {
    const args = stacks.args.pop();
    if (args) {
      // Actually apply the function to the arguments
      return Call(fun, ...args);
    }
    // An empty argument stack means that the function is the evaluation result of a thunk
    // So update the thunk on the stack with the function
    const uframe = stacks.upd.pop();
    if (uframe) {
      [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
      Object.assign(uframe.target, Fun(fun));
      return ReturnFun(fun);
    }
  });
}

// Jump to one of the alternatives on the stack
function ReturnCon(con, ...args) {
  return (stacks) => {
    // Pop the alternatives from the stack
    const alts = stacks.ret.pop();
    if (alts) {
      // Jump to the alternative that matches the constructor
      const alt = alts[con];
      if (alt) {
        return Eval(alt(...args));
      }
      const def = alts.default;
      if (def) {
        return Eval(def(Con(con, ...args)));
      }
      throw new Error("No matched alternatives");
    }
    // Like ReturnFun, update the thunk on the stack with the constructor application
    const uframe = stacks.upd.pop();
    if (uframe) {
      [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
      Object.assign(uframe.target, Con(con, ...args));
      return ReturnCon(con, ...args);
    }
  };
}

// Almost the same as ReturnCon
function ReturnInt(n) {
  return (stacks) => {
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
      throw new Error(`No matched alternatives for ${n}`);
    }
    const uframe = stacks.upd.pop();
    if (uframe) {
      [stacks.ret, stacks.args] = [uframe.ret, uframe.args];
      Object.assign(uframe.target, Int(n));
      return ReturnInt(n);
    }
  };
}
