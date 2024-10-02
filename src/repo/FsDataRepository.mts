import fs from "fs";
import DataRepository from "./DataRepository.mjs";
import { RagChunkedData, RagEmbeddedData, RagQueryResult } from "../types.mjs";
import { fileURLToPath } from "url";
import path from "path";

export default class FsDataRepository extends DataRepository {
  private CHUNKED_DATA_PATH: string;
  private EMBEDDED_DATA_PATH: string;
  private QUERY_RESULT_PATH: string;

  constructor() {
    super();

    this.CHUNKED_DATA_PATH = `../../storage/${this._chunkedDataFileKey}`;
    this.EMBEDDED_DATA_PATH = `../../storage/${this._embeddedDataFileKey}`;
    this.QUERY_RESULT_PATH = "../../query-results";
  }

  async readChunkedDataAsync(): Promise<RagChunkedData> {
    const data = await this.loadJson<RagChunkedData>(this.CHUNKED_DATA_PATH);
    return data ?? this.getDefaultChunkedData();
  }

  async saveChunkedDataAsync(newChunkedData: RagChunkedData) {
    newChunkedData.timestamp = new Date().toISOString();
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
    newEmbeddedData.timestamp = new Date().toISOString();
    await this.writeToFile(
      this.EMBEDDED_DATA_PATH,
      JSON.stringify(newEmbeddedData)
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
