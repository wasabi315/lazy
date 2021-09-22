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
    const pap = (...args2) => fun(...args, ...args2);
    Object.defineProperty(pap, "length", { value: arity - nargs });
    return Fun(pap);
  };
  Object.defineProperty(wrapped, "length", { value: arity });
  return wrapped;
}

function Thunk(innerThunk) {
  let thunk = () => {
    const value = Evaluate(innerThunk);
    thunk = () => value;
    return value;
  };
  return Fun(() => thunk());
}

function Con(conName, ...args) {
  // Takes alternatives as arguments
  return (alts, def) => {
    // Look up an appropriate alternative
    const alt = alts[conName];
    if (alt) {
      // Execute the matched alternative
      return alt(...args);
    }
    if (def) {
      // Create a thunk of constructor
      const x = Thunk(() => Con(conName, ...args));
      // Execute the default alternative
      return def(x);
    }
    throw new Error("No matched alternative");
  };
}

function Int(n) {
  // Takes alternatives as arguments
  return (alts, def) => {
    // Look up an appropriate alternative
    const alt = alts[n];
    if (alt) {
      // Execute matched alternative
      return alt();
    }
    if (def) {
      // Execute default alternative
      return def(n);
    }
    throw new Error("No matched alternative");
  };
}

function Case(x, alts, def) {
  // Pass alternatives to constructors and Int values
  return Evaluate(x)(alts, def);
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

/******************************************************************************/

const Pair = (x, y) => Con("Pair", x, y);
const fst = Fun((p) => {
  return Case(p, {
    Pair: (x, _) => x,
  });
});

const pair = Thunk(() => Pair(1, 2));
console.log(Evaluate(Thunk(() => fst(pair))));

const printInt = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
  });
});
const one = Thunk(() => Int(1));
const main = Thunk(() => printInt(one));
Evaluate(main);
