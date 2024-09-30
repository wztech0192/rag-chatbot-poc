import { RagChunkedData, RagEmbeddedData, RagQueryResult } from "../types.mjs";

export default class DataRepository {
  chunkedData: RagChunkedData | null = null;
  embeddedData: RagEmbeddedData | null = null;

  async readChunkedDataAsync(): Promise<RagChunkedData> {
    throw new Error("Not implemented");
  }

  async saveChunkedDataAsync(_newData: RagChunkedData) {
    throw new Error("Not implemented");
  }

  async getChunkedDataAsync(): Promise<RagChunkedData> {
    if (this.chunkedData) {
      return this.chunkedData;
    }
    const chunkedData = await this.readChunkedDataAsync();
    this.chunkedData = chunkedData;
    return chunkedData;
  }

  getDefaultChunkedData(): RagChunkedData {
    return {
      timestamp: this.getTimeStamp(),
      source: "",
      documents: [],
    };
  }

  async readEmbeddedDataAsync(): Promise<RagEmbeddedData> {
    throw new Error("Not implemented");
  }

  async saveEmbeddedDataAsync(_newData: RagEmbeddedData) {
    throw new Error("Not implemented");
  }

  async getEmbeddedDataAsync(): Promise<RagEmbeddedData> {
    if (this.embeddedData) {
      return this.embeddedData;
    }
    const embeddedData = await this.readEmbeddedDataAsync();
    this.embeddedData = embeddedData;
    return embeddedData;
  }

  getDefaultEmbeddedData(): RagEmbeddedData {
    return {
      timestamp: this.getTimeStamp(),
      data: [],
      model: "",
    };
  }

  async logQueryResult(_result: RagQueryResult) {
    throw new Error("Not implemented");
  }

  getTimeStamp() {
    return new Date().toISOString();
  }
}
