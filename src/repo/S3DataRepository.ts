import { S3_BUCKET, S3_ENDPOINT, S3_REGION } from "../config.mjs";
import { RagChunkedData, RagEmbeddedData, RagQueryResult } from "../types.mjs";
import DataRepository from "./DataRepository.mjs";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export default class S3DataRepository extends DataRepository {
  private _s3: S3Client;

  // use to track data freshness
  private _chunkedDataTimestamp: string = "";
  private _embeddedDataTimestamp: string = "";

  constructor() {
    super();

    if (!S3_BUCKET) {
      throw new Error("IA_S3_BUCKET is required");
    }

    if (!S3_REGION) {
      throw new Error("IA_S3_REGION is required");
    }

    this._s3 = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
    });
  }

  async readChunkedDataAsync(): Promise<RagChunkedData> {
    try {
      const data = await this._s3.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: this._chunkedDataFileKey,
        })
      );
      const json = await data.Body?.transformToString();
      return JSON.parse(json ?? "") ?? this.getDefaultChunkedData();
    } catch (err) {
      console.error("Failed to load chunked data from S3", err);
    }
    return this.getDefaultChunkedData();
  }

  async saveChunkedDataAsync(newChunkedData: RagChunkedData) {
    newChunkedData.timestamp = new Date().toISOString();
    await this._s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: this._chunkedDataFileKey,
        Body: JSON.stringify(newChunkedData),
        ContentType: "application/json",
        Metadata: {
          timestamp: newChunkedData.timestamp,
        },
      })
    );

    this.chunkedData = newChunkedData;
  }

  async getChunkedDataAsync(): Promise<RagChunkedData> {
    if (this.chunkedData) {
      // check if data is up to date
      const data = await this._s3.send(
        new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: this._chunkedDataFileKey,
        })
      );

      if (this._chunkedDataTimestamp !== data.Metadata?.timestamp) {
        console.log("Load chunked data from S3...");
        this.chunkedData = null;
        this._chunkedDataTimestamp = data.Metadata?.timestamp ?? "";
      }
    }

    return await super.getChunkedDataAsync();
  }

  async readEmbeddedDataAsync(): Promise<RagEmbeddedData> {
    try {
      const data = await this._s3.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: this._embeddedDataFileKey,
        })
      );
      const json = await data.Body?.transformToString();
      return JSON.parse(json ?? "") ?? this.getDefaultEmbeddedData();
    } catch (err) {
      console.error("Failed to load embedded data from S3", err);
    }
    return this.getDefaultEmbeddedData();
  }

  async saveEmbeddedDataAsync(newEmbeddedData: RagEmbeddedData) {
    newEmbeddedData.timestamp = new Date().toISOString();
    await this._s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: this._embeddedDataFileKey,
        Body: JSON.stringify(newEmbeddedData),
        ContentType: "application/json",
        Metadata: {
          timestamp: newEmbeddedData.timestamp,
        },
      })
    );

    this.embeddedData = newEmbeddedData;
  }

  async getEmbeddedDataAsync(): Promise<RagEmbeddedData> {
    if (this.embeddedData) {
      // check if data is up to date
      const data = await this._s3.send(
        new HeadObjectCommand({
          Bucket: S3_BUCKET,
          Key: this._embeddedDataFileKey,
        })
      );

      if (this._embeddedDataTimestamp !== data.Metadata?.timestamp) {
        console.log("Load embedded data from S3...");
        this.embeddedData = null;
        this._embeddedDataTimestamp = data.Metadata?.timestamp ?? "";
      }
    }

    return await super.getEmbeddedDataAsync();
  }

  async logQueryResult(result: RagQueryResult) {
    console.debug(result);
  }
}
