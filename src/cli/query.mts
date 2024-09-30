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
      const result = await queryData(inputArg, dataRepo); // Treat it as a query

      if (!result) {
        console.log(
          chark.red("No processed data found. Please process data first.")
        );
      } else {
        console.log(
          chark.greenBright(
            `Intelligent Assistant:\n${result.choices[0].message.content}\n`
          )
        );
      }
      promptUser();
    }
  });
}

// Start the loop
await promptUser();
