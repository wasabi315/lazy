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

/******************************************************************************/

const Pair = (x, y) => Con("Pair", x, y);
const fst = Fun((p) => {
  return Case(p, {
    Pair: (x, _) => x,
  });
});

const pair = Thunk(() => Pair(1, 2));
console.log(Evaluate(Thunk(() => fst(pair))));
