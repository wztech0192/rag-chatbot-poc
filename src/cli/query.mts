import chark from "chalk";
import readline from "readline";
import FsDataRepository from "../repo/FsDataRepository.mjs";
import { queryData } from "../pipeline/query-data.mjs";

const dataRepo = new FsDataRepository();

// Create an interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to continuously prompt the user for input
async function promptUser() {
  await rl.question("You:\n", async (inputArg) => {
    if (!inputArg) {
      promptUser();
    }
    if (inputArg.toLowerCase() === "quit") {
      console.log(chark.green("Exiting..."));
      rl.close(); // Close the input stream and exit
    } else {
      const result = await queryData({
        query: inputArg,
        dataRepo,
        mode: "rag",
      }); // Treat it as a query

      console.log(
        chark.greenBright(`Intelligent Assistant:\n${result.response}\n`)
      );

      promptUser();
    }
  });
}

// Start the loop
await promptUser();
