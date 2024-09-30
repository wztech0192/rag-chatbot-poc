import fs from "fs";
import DataRepository from "./DataRepository.mjs";
import { EMBEDDING_MODEL, SF_BASE_URL } from "../config.mjs";
import { sha256inb64 } from "../utils.mjs";
import { RagChunkedData, RagEmbeddedData, RagQueryResult } from "../types.mjs";
import { fileURLToPath } from "url";
import path from "path";

export default class FsDataRepository extends DataRepository {
  private CHUNKED_DATA_PATH: string;
  private EMBEDDED_DATA_PATH: string;
  private QUERY_RESULT_PATH: string;

  constructor() {
    super();

    const sourceHash = sha256inb64(SF_BASE_URL, 6);
    this.CHUNKED_DATA_PATH = `../../storage/${sourceHash}/chunked-data.json`;
    this.EMBEDDED_DATA_PATH = `../../storage/${sourceHash}/embedded-data-${EMBEDDING_MODEL}.json`;
    this.QUERY_RESULT_PATH = "../../query-results";
  }

  async readChunkedDataAsync(): Promise<RagChunkedData> {
    const data = await this.loadJson<RagChunkedData>(this.CHUNKED_DATA_PATH);
    return data ?? this.getDefaultChunkedData();
  }

  async saveChunkedDataAsync(newChunkedData: RagChunkedData) {
    await this.writeToFile(
      this.CHUNKED_DATA_PATH,
      JSON.stringify(newChunkedData, null, 2)
    );
    this.chunkedData = newChunkedData;
  }

  async readEmbeddedDataAsync(): Promise<RagEmbeddedData> {
    const data = await this.loadJson<RagEmbeddedData>(this.EMBEDDED_DATA_PATH);
    return data ?? this.getDefaultEmbeddedData();
  }

  async saveEmbeddedDataAsync(newEmbeddedData: RagEmbeddedData) {
    await this.writeToFile(
      this.EMBEDDED_DATA_PATH,
      JSON.stringify(newEmbeddedData, null, 2)
    );
    this.embeddedData = newEmbeddedData;
  }

  async logQueryResult(result: RagQueryResult) {
    await this.writeToFile(
      `${this.QUERY_RESULT_PATH}/${new Date().getTime()}.json`,
      JSON.stringify(result, null, 2)
    );
  }

  private async loadJson<T>(path: string) {
    try {
      const fData = fs.readFileSync(new URL(path, import.meta.url)).toString();
      return JSON.parse(fData) as T;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  private async writeToFile<T>(filePath: string, data: string) {
    filePath = fileURLToPath(new URL(filePath, import.meta.url));
    const directory = path.dirname(filePath);

    fs.mkdirSync(directory, { recursive: true });

    fs.writeFileSync(filePath, data);
  }
}
