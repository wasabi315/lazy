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

function Thunk(thunkFun) {
  let thunk = () => {
    const value = Evaluate(thunkFun);
    thunk = () => value;
    return value;
  };
  return Fun(() => thunk());
}

// コンストラクタの適用 => 適切な継続(alternatives)を選ぶ
function Con(con, ...args) {
  return (alts, def) => {
    const alt = alts[con];
    // マッチするalternativeがあった時
    if (alt) {
      return alt(...args);
    }

    // デフォルトのalternativeがあった時
    if (def) {
      const x = Thunk(() => Con(con, ...args));
      return def(x);
    }

    throw new Error("No matched alternative");
  };
}

function Case(x, alts, def) {
  // xを評価してそこに継続を渡す
  return Evaluate(x)(alts, def);
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

const nil = Con("nil");
const cons = (x, xs) => Con("cons", x, xs);

const undef = Thunk(() => {
  throw new Error("undef");
});

const head = Fun((xs) =>
  Case(xs, {
    cons: (x, _) => x,
  })
);

const one = Thunk(() => 1);
const list1 = Thunk(() => cons(undef, nil));
const list2 = Thunk(() => cons(undef, list1));
const list3 = Thunk(() => cons(one, list2));
console.log(Evaluate(head(list3)));
console.log(Evaluate(head(nil)));
