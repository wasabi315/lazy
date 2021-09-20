// １回評価したら次はその値を返す
function Thunk(thunkFun) {
  let thunk = () => {
    const value = Evaluate(thunkFun);
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

const one = Thunk(() => {
  console.log("one evaluated");
  return 1;
});
const one_ = Thunk(() => one);

console.log(Evaluate(one_));
console.log(Evaluate(one_));
