function Thunk(innerThunk) {
  // Evaluate innerThunk and return the evaluated value when gets called
  return () => Evaluate(innerThunk);
}

function Evaluate(value) {
  // Unwrap nested thunks
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

/******************************************************************************/

const one1 = Thunk(() => {
  console.log("one1 evaluated");
  return 1;
});
const one2 = Thunk(() => one1);

console.log(one2);
console.log(Evaluate(one2));
