function Fun(fun) {
  const arity = fun.length;
  const wrapped = (...args) => {
    const nargs = args.length;
    if (arity === nargs) {
      return fun(...args);
    }
    if (arity < nargs) {
      return fun(...args.slice(0, arity))(...args.slice(arity));
    }
    const pap = (...extraArgs) => fun(...args, ...extraArgs);
    Object.defineProperty(pap, "length", { value: arity - nargs });
    return Fun(pap);
  };
  Object.defineProperty(wrapped, "length", { value: arity });
  return wrapped;
}

function Blackhole() {
  throw new Error("Blackhole");
}

function Thunk(thunkFun) {
  let thunk = () => {
    thunk = Blackhole;
    const value = Evaluate(thunkFun);
    thunk = () => value;
    return value;
  };
  return Fun(() => thunk());
}

function Raw(value) {
  return (alts, def) => {
    const alt = alts[value];
    if (alt) {
      return alt();
    }

    if (def) {
      return def(value);
    }

    throw new Error("No matched alternative");
  };
}

function Con(con, ...args) {
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

function Case(x, alts, def) {
  return Evaluate(x)(alts, def);
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

const add = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Raw(n + m));
    });
  });
});
const one = Thunk(() => Raw(1));

const bad = Thunk(() => add(one, bad));
try {
  Evaluate(bad);
} catch (err) {
  console.error(err.message);
}

const bad2 = Thunk(() => bad2);
try {
  Evaluate(bad2);
} catch (err) {
  console.error(err.message);
}

const cons = (x, xs) => Con("cons", x, xs);
const ok = Thunk(() => cons(one, ok));
try {
  Evaluate(ok);
} catch (err) {
  console.error(err);
}
