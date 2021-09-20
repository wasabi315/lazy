// 過剰引数や部分適用を可能にする
function Fun(fun) {
  const arity = fun.length;
  const wrapped = (...args) => {
    const nargs = args.length;
    // exact
    if (arity === nargs) {
      return fun(...args);
    }
    // oversaturated
    if (arity < nargs) {
      return fun(...args.slice(0, arity))(...args.slice(arity));
    }
    // unsaturated
    const pap = (...extraArgs) => fun(...args, ...extraArgs);
    Object.defineProperty(pap, "length", { value: arity - nargs });
    return Fun(pap);
  };
  Object.defineProperty(wrapped, "length", { value: arity });
  return wrapped;
}

function Thunk(thunkFun) {
  let thunk = () => {
    const value = Evaluate(thunkFun);
    thunk = () => value;
    return value;
  };
  return Fun(() => thunk());
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

const const_ = Fun((x, _) => x);

const add = Fun((x, y) => {
  x = Evaluate(x);
  y = Evaluate(y);
  return Thunk(() => {
    return x + y;
  });
});

const one = Thunk(() => 1);
// 過剰引数
console.log(Evaluate(const_(add, add, one, one)));
// 部分適用
console.log(Evaluate(Thunk(() => const_(add))(add, one, one)));

// fix f = let x = f x in x
const fix = Fun((f) => {
  const x = Thunk(() => f(x));
  return x;
});

const sub = Fun((x, y) => {
  x = Evaluate(x);
  y = Evaluate(y);
  return Thunk(() => {
    return x - y;
  });
});

const mul = Fun((x, y) => {
  x = Evaluate(x);
  y = Evaluate(y);
  return Thunk(() => {
    return x * y;
  });
});

const fact_ = Fun((f, n) => {
  const x = Evaluate(n);
  if (x === 0) {
    return one;
  }
  const m = Thunk(() => sub(n, one));
  const fm = Thunk(() => f(m));
  return mul(n, fm);
});
const fact = fix(fact_);

console.log(Evaluate(fact(Thunk(() => 10))));
