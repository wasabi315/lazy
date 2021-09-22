import { Fun, Thunk, Int, Con, Case, Evaluate } from "./lazy.js";

const True = Con("True");
const False = Con("False");

const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Int(n - m));
    });
  });
});
const lte = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return n <= m ? True : False;
    });
  });
});

const Unit = Con("Unit");
const pure = Fun((x) => x);
const printInt = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return pure(Unit);
  });
});

const tarai = Fun((x, y, z) => {
  return Case(lte(x, y), {
    True: () => y,
    False: () => {
      const one = Thunk(() => Int(1));
      const x1 = Thunk(() => sub(x, one));
      const t1 = Thunk(() => tarai(x1, y, z));
      const y1 = Thunk(() => sub(y, one));
      const t2 = Thunk(() => tarai(y1, z, x));
      const z1 = Thunk(() => sub(z, one));
      const t3 = Thunk(() => tarai(z1, x, y));
      return tarai(t1, t2, t3);
    },
  });
});

const main = Thunk(() => {
  const x = Thunk(() => Int(15));
  const y = Thunk(() => Int(5));
  const z = Thunk(() => Int(0));
  const t = Thunk(() => tarai(x, y, z));
  return printInt(t);
});

console.log("lazy tarai");
measure(() => Evaluate(main));

function strictTarai(x, y, z) {
  if (x <= y) {
    return y;
  }
  return strictTarai(
    strictTarai(x - 1, y, z),
    strictTarai(y - 1, z, x),
    strictTarai(z - 1, x, y)
  );
}

console.log("strict tarai");
measure(() => console.log(strictTarai(15, 5, 0)));

function measure(f) {
  const start = performance.now();
  f();
  const end = performance.now();
  console.log(`took ${end - start}ms`);
}
