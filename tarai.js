import { Fun, Thunk, Raw, Con, Case, Evaluate } from "./lazy.js";

const True = Thunk(() => Con("True"));
const False = Thunk(() => Con("False"));

const Num = (n) => Thunk(() => Raw(n));
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

const unit = Thunk(() => Con("unit"));
const printRaw = Fun((x) => {
  return Case(x, {}, (n) => {
    console.log(n);
    return unit;
  });
});

const tarai = Fun((x, y, z) => {
  return Case(lte(x, y), {
    True: () => y,
    False: () => {
      const x1 = Thunk(() => sub(x, Num(1)));
      const t1 = Thunk(() => tarai(x1, y, z));
      const y1 = Thunk(() => sub(y, Num(1)));
      const t2 = Thunk(() => tarai(y1, z, x));
      const z1 = Thunk(() => sub(z, Num(1)));
      const t3 = Thunk(() => tarai(z1, x, y));
      return tarai(t1, t2, t3);
    },
  });
});

const main = Thunk(() => {
  const t = tarai(Num(15), Num(5), Num(0));
  return printRaw(t);
});

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

console.log(strictTarai(15, 5, 0));
