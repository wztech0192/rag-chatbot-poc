import FsDataRepository from "../repo/FsDataRepository.mjs";
import { embedData } from "../pipeline/embed-data.mjs";

const dataRepo = new FsDataRepository();

const chunkedData = await dataRepo.getChunkedDataAsync();

const embeddedData = await dataRepo.getEmbeddedDataAsync();

const embedDataResult = await embedData(chunkedData, embeddedData);

if (embedDataResult.isUpdated) {
  await dataRepo.saveEmbeddedDataAsync(embedDataResult.data);
}
