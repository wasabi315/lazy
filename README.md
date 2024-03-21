# lazy.js

A STG-like lazy evaluation mechanism in JavaScript

```javascript
// fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
const fibs = Thunk(() => {
  const xs = Thunk(() => tail(fibs));
  const ys = Thunk(() => zipWith(add, fibs, xs));
  const zs = Thunk(() => Cons(1n, ys));
  return Cons(0n, zs);
});
```

For usage and more examples, see [prelude.js](./prelude.js) and the [examples](./examples) directory.

## Reference

- Simon Marlow and Simon Peyton Jones. 2004. Making a fast curry: push/enter vs. eval/apply for higher-order languages. SIGPLAN Not. 39, 9 (September 2004), 4–15. <https://doi.org/10.1145/1016848.1016856>
