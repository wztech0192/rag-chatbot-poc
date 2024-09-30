import FsDataRepository from "../repo/FsDataRepository.mjs";
import { gatherData } from "../pipeline/gather-data.mjs";
import { chunkData } from "../pipeline/chunk-data.mjs";
import chark from "chalk";

try {
  const dataRepo = new FsDataRepository();

  console.log(chark.green("Preparing data started..."));

  const chunkedData = await dataRepo.getChunkedDataAsync();

  const fetchedData = await gatherData(chunkedData);

  const newChunkedData = await chunkData(fetchedData);

  await dataRepo.saveChunkedDataAsync(newChunkedData);

  console.log(chark.green("Completed data preparation..."));
} catch (err) {
  console.error(err);
}
