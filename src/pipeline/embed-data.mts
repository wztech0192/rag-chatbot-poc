import {
  IsUpdatedResponse,
  RagChunkedData,
  RagEmbeddedChunk,
  RagEmbeddedData,
} from "../types.mjs";
import { EMBEDDING_MODEL, embeddingClient } from "../config.mjs";
import chark from "chalk";
import { chunkArray } from "../utils.mjs";

// Function to simulate training process
export async function embedData(
  chunkedData: RagChunkedData,
  embeddedData: RagEmbeddedData
): Promise<IsUpdatedResponse<RagEmbeddedData>> {
  let isUpdated = false;
  console.log(chark.green("Embedding process started..."));

  const existingEmbeddedDataMap = embeddedData.data.reduce((acc, d) => {
    acc[d.hash] = d;
    return acc;
  }, {} as Record<string, RagEmbeddedChunk>);

  const result: RagEmbeddedChunk[] = [];
  const dataToBeEmbed: Omit<RagEmbeddedChunk, "embedding">[] = [];

  for (const doc of chunkedData.documents) {
    for (const chunkData of doc.chunks ?? []) {
      if (existingEmbeddedDataMap[chunkData.hash]) {
        result.push(existingEmbeddedDataMap[chunkData.hash]);
      } else {
        isUpdated = true;
        console.log(chark.blue(`Prepare ${chunkData.hash} for embedding...`));
        dataToBeEmbed.push({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          ...chunkData,
        });
      }
    }
  }

  console.log(chark.blue(`Embedding ${dataToBeEmbed.length} data...`));

  for (const chunks of chunkArray(dataToBeEmbed)) {
    try {
      const embeddingRes = await embeddingClient.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunks.map((c) => `${c.type} title: ${c.title}. ${c.value}`),
      });

      embeddingRes.data.forEach((embedding, index) => {
        result.push({
          ...chunks[index],
          embedding: embedding.embedding,
        });
      });
    } catch (error) {
      console.error(`Error embedding data: ${error}`);
    }
    console.log(chark.blue(`Embedded ${chunks.length} data chunk...`));
  }

  console.log(chark.green(`Embedding data completed`));

  return {
    data: {
      model: EMBEDDING_MODEL,
      timestamp: new Date().toISOString(),
      data: result,
    },
    isUpdated,
  };
}
