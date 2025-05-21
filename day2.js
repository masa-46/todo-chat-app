// day2.js

// --- ES6 配列操作 --------------------------------
const nums = [1, 2, 3, 4, 5];

// 偶数だけ抽出
const evens = nums.filter((n) => n % 2 === 0);
console.log("偶数:", evens); // [2, 4]

// 要素を 2 倍
const doubled = nums.map((n) => n * 2);
console.log("2倍:", doubled); // [2, 4, 6, 8, 10]

// 分割代入とスプレッド
const person = { name: "Taro", age: 20, city: "Tokyo" };
const { name, ...rest } = person;
console.log(name, rest); // Taro { age: 20, city: 'Tokyo' }

// --- async/await 入門 -----------------------------
const fakeFetch = () =>
  new Promise((res) => setTimeout(() => res("サーバーからのデータ"), 1000));

async function main() {
  console.log("フェッチ開始…");
  const data = await fakeFetch(); // 1 秒待って結果を受信
  console.log("受信:", data);
}

main();
