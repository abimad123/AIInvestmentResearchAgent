import { app } from "./lib/agent/graph";

async function run() {
  const initialState = {
    companyName: "Tesla",
  };
  
  console.log("Starting mock run for:", initialState.companyName);
  
  const result = await app.invoke(initialState);
  
  console.log("\nFinal state:");
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
