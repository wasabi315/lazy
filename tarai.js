import { Fun, Thunk, Raw, Con, Case, Evaluate } from "./lazy.js";

const True = Con("True");
const False = Con("False");

const sub = Fun((x, y) => {
  return Case(x, {}, (n) => {
    return Case(y, {}, (m) => {
      return Thunk(() => Raw(n - m));
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

const Unit = Thunk(() => Con("Unit"));
const pure = Fun((x) => x);
const printRaw = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return pure(Unit);
  });
});

const tarai = Fun((x, y, z) => {
  return Case(lte(x, y), {
    True: () => y,
    False: () => {
      const one = Thunk(() => Raw(1));
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
  const x = Thunk(() => Raw(15));
  const y = Thunk(() => Raw(5));
  const z = Thunk(() => Raw(0));
  const t = Thunk(() => tarai(x, y, z));
  return printRaw(t);
});

console.log("lazy tarai");
Evaluate(main);

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
console.log(strictTarai(15, 5, 0));
