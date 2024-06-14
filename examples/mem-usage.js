import { Fun, Thunk, EvaluateGen } from "../lazy.js";
import { Cons, traverseList_, IO, printInt, runIO } from "../prelude.js";

const repeat = Fun((x) => {
  const xs = Thunk(() => Cons(x, xs));
  return xs;
});

const main = Thunk(() => {
  const ns = Thunk(() => repeat(1));
  return traverseList_(IO)(printInt, ns);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  while (true) {
    const mem = Deno.memoryUsage();
    const percent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    console.error(`Memory usage: ${percent}%`);
    await sleep(500);
  }
})();

for (const _ of EvaluateGen(runIO(main))) {
  await sleep(0);
}
