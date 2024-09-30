import FsDataRepository from "../repo/FsDataRepository.mjs";
import { embedData } from "../pipeline/embed-data.mjs";

const dataRepo = new FsDataRepository();

const chunkedData = await dataRepo.getChunkedDataAsync();

const embeddedData = await dataRepo.getEmbeddedDataAsync();

const newEmbeddedData = await embedData(chunkedData, embeddedData);

await dataRepo.saveEmbeddedDataAsync(newEmbeddedData);
