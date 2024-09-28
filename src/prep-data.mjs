import { fetchData } from "./fetch-data.mjs";
import { chunkData } from "./chunk-data.mjs";
import { CHUNKED_DATA_PATH, loadJSON, writeToFile } from "./utils.mjs";
import chark from "chalk";

async function prepData() {
  console.log(chark.green("Preparing data started..."));

  const fetchedData = await fetchData(
    (await loadJSON(CHUNKED_DATA_PATH)) ?? []
  );

  const processedData = await chunkData(fetchedData);

  writeToFile(CHUNKED_DATA_PATH, JSON.stringify(processedData, null, 2));

  console.log(chark.green("Completed data preparation..."));
}

await prepData();
