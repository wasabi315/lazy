function Fun(fun) {
  return fun;
}

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

// xの評価はしない(サンクのまま)
const id = Fun((x) => x);

// 足し算は各引数を評価する
const add = Fun((x, y) => {
  x = Evaluate(x);
  y = Evaluate(y);
  return Thunk(() => {
    console.log(`adding ${x} and ${y}`);
    return x + y;
  });
});

const one = Thunk(() => {
  console.log("one evaluated");
  return 1;
});
const two = Thunk(() => add(one, one));
const four = Thunk(() => add(two, two));
console.log(Evaluate(id(four)));
