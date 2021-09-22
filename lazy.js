export function Fun(fun) {
  const arity = fun.length;
  const wrapped = (...args) => {
    const nargs = args.length;
    if (arity === nargs) {
      return fun(...args);
    }
    if (arity < nargs) {
      return fun(...args.slice(0, arity))(...args.slice(arity));
    }
    const pap = (...args2) => fun(...args, ...args2);
    Object.defineProperty(pap, "length", { value: arity - nargs });
    return Fun(pap);
  };
  Object.defineProperty(wrapped, "length", { value: arity });
  return wrapped;
}

export function Thunk(innerThunk) {
  let thunk = () => {
    thunk = Blackhole;
    const value = Evaluate(innerThunk);
    thunk = () => value;
    return value;
  };
  return Fun(() => thunk());
}

function Blackhole() {
  throw new Error("Blackhole");
}

export function Con(con, ...args) {
  return (alts, def) => {
    const alt = alts[con];
    if (alt) {
      return alt(...args);
    }
    if (def) {
      const x = Thunk(() => Con(con, ...args));
      return def(x);
    }
    throw new Error("No matched alternative");
  };
}

export function Int(n) {
  return (alts, def) => {
    const alt = alts[n];
    if (alt) {
      return alt();
    }
    if (def) {
      return def(n);
    }
    throw new Error("No matched alternative");
  };
}

export function Case(x, alts, def) {
  return Evaluate(x)(alts, def);
}

export function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}
