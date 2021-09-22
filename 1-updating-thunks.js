function Thunk(innerThunk) {
  let thunk = () => {
    // First, evaluate innerThunk
    const value = Evaluate(innerThunk);
    // Then, self-updating to return evaluated value
    thunk = () => value;
    return value;
  };
  return () => thunk();
}

function Evaluate(value) {
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

/******************************************************************************/

const one = Thunk(() => {
  console.log("one evaluated");
  return 1;
});

console.log(Evaluate(one));
console.log(Evaluate(one));
