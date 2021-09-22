function Fun(fun) {
  const arity = fun.length;
  const wrapped = (...args) => {
    const nargs = args.length;
    // Exact
    if (arity === nargs) {
      // Just apply arguments
      return fun(...args);
    }
    // Over-saturated call
    if (arity < nargs) {
      // Apply the expected number of arguments then apply the rest
      return fun(...args.slice(0, arity))(...args.slice(arity));
    }
    // Under-saturated call
    // Return a function that takes missing arguments
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
  // Wrap with Fun to evaluate thunks of function when arguments are applied
  return Fun(() => thunk());
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

/******************************************************************************/

// const_ handles under- and over-saturated calls automatically
const const_ = Fun((x, _) => x);
const three = Thunk(() => 3);
const five = Thunk(() => 5);

const const3 = Thunk(() => const_(three));
console.log(Evaluate(Thunk(() => const3(three))));

console.log(Evaluate(Thunk(() => const_(const_, const_, three, five))));
