import { Thunk, Case, Fun, Evaluate } from "../lazy.js";
import { lte, sub, runIO, printInt } from "../prelude.js";

const tarai = Fun((x, y, z) =>
  Case(lte(x, y), {
    True: () => y,
    False: () => {
      const x1 = Thunk(() => sub(x, 1));
      const t1 = Thunk(() => tarai(x1, y, z));
      const y1 = Thunk(() => sub(y, 1));
      const t2 = Thunk(() => tarai(y1, z, x));
      const z1 = Thunk(() => sub(z, 1));
      const t3 = Thunk(() => tarai(z1, x, y));
      return tarai(t1, t2, t3);
    },
  })
);

const main = Thunk(() => {
  const t = Thunk(() => tarai(15, 5, 0));
  return printInt(t);
});

console.log("lazy tarai");
measure(() => Evaluate(runIO(main)));

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
