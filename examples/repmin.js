import { Case, Con, Evaluate, Fun, Thunk, Tuple } from "../lazy.js";
import { traceInt, Unit, seq, fst, snd, min } from "../prelude.js";

const Leaf = (n) => Con("Leaf", n);
const Branch = (l, r) => Con("Branch", l, r);
const traceTree = Fun((t) =>
  Case(t, {
    Leaf: (n) => traceInt(n),
    Branch: (l, r) => {
      const s = Thunk(() => seq(traceTree(r), Unit));
      return seq(traceTree(l), s);
    },
  })
);

const repminAux = Fun((m, t) =>
  Case(t, {
    Leaf: (n) => {
      const leaf = Thunk(() => Leaf(m));
      return Tuple(n, leaf);
    },
    Branch: (l, r) => {
      const res1 = Thunk(() => repminAux(m, l));
      const m1 = Thunk(() => fst(res1));
      const t1 = Thunk(() => snd(res1));
      const res2 = Thunk(() => repminAux(m, r));
      const m2 = Thunk(() => fst(res2));
      const t2 = Thunk(() => snd(res2));
      const m3 = Thunk(() => min(m1, m2));
      const t3 = Thunk(() => Branch(t1, t2));
      return Tuple(m3, t3);
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

const main = Thunk(() => {
  const t1 = Thunk(() => traceTree(tree1));
  const tree2 = Thunk(() => repmin(tree1));
  const t2 = Thunk(() => traceTree(tree2));
  const s = Thunk(() => seq(t2, Unit));
  return seq(t1, s);
});

Evaluate(main);
