function Thunk(innerThunk) {
  let thunk = () => {
    const value = Evaluate(innerThunk);
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

// id is lazy in its argument
const id = (x) => x;

// add is strict in both of its arguments
const add = (x, y) => {
  // *Required to evaluate* to get inner numbers
  x = Evaluate(x);
  y = Evaluate(y);
  return Thunk(() => x + y);
};

const one = Thunk(() => 1);
const one2 = Thunk(() => id(one));
console.log(Evaluate(one2));

const two = Thunk(() => add(one, one));
const four = Thunk(() => add(two, two));
console.log(Evaluate(four));
