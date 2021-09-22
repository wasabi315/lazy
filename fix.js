import { Fun, Thunk, Int, Con, Case, Evaluate } from "./lazy.js";

// fix f = let x = f x in x
const fix = Fun((f) => {
  const x = Thunk(() => f(x));
  return x;
});

const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Int(n - m));
    });
  });
});
const mul = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Int(n * m));
    });
  });
});

const one = Thunk(() => Int(1));
const fact_ = Fun((f, n) => {
  return Case(
    n,
    {
      [0]: () => one,
    },
    () => {
      const m = Thunk(() => sub(n, one));
      const fm = Thunk(() => f(m));
      return mul(n, fm);
    }
  );
});
const fact = fix(fact_);

const Unit = Con("Unit");
const pure = Fun((x) => x);
const printInt = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return pure(Unit);
  });
});

const main = Thunk(() => {
  const n = Thunk(() => Int(10));
  const factN = Thunk(() => fact(n));
  return printInt(factN);
});

Evaluate(main);
