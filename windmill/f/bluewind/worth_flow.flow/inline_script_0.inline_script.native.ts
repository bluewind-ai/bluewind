// Fetch-only script, no imports allowed (except windmill) but benefits from a dedicated highly efficient runtime
//import * as wmill from './windmill.ts'

export async function main(example_input: nocodb = 3) {
  // "3" is the default value of example_input, it can be overriden with code or using the UI
  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${example_input}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
