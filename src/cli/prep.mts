import FsDataRepository from "../repo/FsDataRepository.mjs";
import { gatherData } from "../pipeline/gather-data.mjs";
import { chunkData } from "../pipeline/chunk-data.mjs";
import chark from "chalk";

try {
  const dataRepo = new FsDataRepository();

  console.log(chark.green("Preparing data started..."));

  const chunkedData = await dataRepo.getChunkedDataAsync();

  const gatherDataResult = await gatherData(chunkedData);

  if (gatherDataResult.isUpdated) {
    const chunkDataResult = await chunkData(gatherDataResult.data);

    if (chunkDataResult.isUpdated) {
      console.log(chark.green("Saving data..."));
      await dataRepo.saveChunkedDataAsync(chunkDataResult.data);
    }
  }

  console.log(chark.green("Completed data preparation..."));
} catch (err) {
  console.error(err);
}
