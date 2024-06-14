import { Case, Con, Evaluate, Fun, Thunk } from "../lazy.js";
import { Pair, min, IO, printInt, runIO } from "../prelude.js";

const Leaf = (n) => Con("Leaf", n);
const Branch = (l, r) => Con("Branch", l, r);
const traverseTree_ = (monad) =>
  Fun((f, t) => {
    return Case(t, {
      Leaf: (n) =>
        monad.Do(function* () {
          yield Thunk(() => f(n));
        }),
      Branch: (l, r) =>
        monad.Do(function* () {
          yield Thunk(() => traverseTree_(monad)(f, l));
          yield Thunk(() => traverseTree_(monad)(f, r));
        }),
    });
  });

const repminAux = Fun((m, t) =>
  Case(t, {
    Leaf: (n) => {
      const leaf = Thunk(() => Leaf(m));
      return Pair(n, leaf);
    },
    Branch: (l, r) => {
      const [m1, t1] = Thunk(() => repminAux(m, l));
      const [m2, t2] = Thunk(() => repminAux(m, r));
      const m3 = Thunk(() => min(m1, m2));
      const t3 = Thunk(() => Branch(t1, t2));
      return Pair(m3, t3);
    },
  })
);

const repmin = Fun((t) => {
  const [m, r] = Thunk(() => repminAux(m, t));
  return r;
});

const tree1 = Thunk(() => {
  const leaf1 = Thunk(() => Leaf(3));
  const leaf2 = Thunk(() => Leaf(2));
  const leaf3 = Thunk(() => Leaf(0));
  const leaf4 = Thunk(() => Leaf(1));
  const branch1 = Thunk(() => Branch(leaf1, leaf2));
  const branch2 = Thunk(() => Branch(leaf3, leaf4));
  return Branch(branch1, branch2);
});

const main = IO.Do(function* () {
  yield Thunk(() => traverseTree_(IO)(printInt, tree1));
  const tree2 = Thunk(() => repmin(tree1));
  yield Thunk(() => traverseTree_(IO)(printInt, tree2));
});

Evaluate(runIO(main));
