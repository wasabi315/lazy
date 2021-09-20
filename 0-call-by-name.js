function Thunk(thunkFun) {
  return () => Evaluate(thunkFun);
}

// 値は即値かサンク
function Evaluate(value) {
  // 無引数関数を剥がす
  while (typeof value === "function" && value.length === 0) {
    value = value();
  }
  return value;
}

const boxed = Thunk(() => {
  console.log("one1 evaluated");
  return 1;
});
const unboxed = 1;

console.log(Evaluate(boxed));
console.log(Evaluate(boxed));
console.log(Evaluate(unboxed));
