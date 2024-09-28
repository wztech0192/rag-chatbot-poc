import {
  EMBEDDED_DATA_PATH,
  EMBEDDING_MODEL,
  embeddingClient,
  loadJSON,
  CHUNKED_DATA_PATH,
  writeToFile,
  chunkArray,
} from "./utils.mjs";
import chark from "chalk";

// Function to simulate training process
async function embedData() {
  console.log(chark.green("Embedding process started..."));

  const processedData = await loadJSON(CHUNKED_DATA_PATH);
  const existingEmbeddedData = (await loadJSON(EMBEDDED_DATA_PATH)) ?? [];

  const existingEmbeddedDataMap = existingEmbeddedData.reduce((acc, d) => {
    acc[d.hash] = d;
    return acc;
  }, {});

  if (!processedData) {
    console.log(
      chark.red("No processed data found. Please process data first.")
    );
    promptUser();
    return;
  }

  const result = [];
  const dataToBeEmbed = [];

  for (const data of processedData) {
    for (const chunkData of data.chunks) {
      if (existingEmbeddedDataMap[chunkData.hash]) {
        result.push(existingEmbeddedDataMap[chunkData.hash]);
      } else {
        console.log(chark.blue(`Prepare ${chunkData.hash} for embedding...`));
        dataToBeEmbed.push({
          id: data.id,
          type: data.type,
          summary: data.summary,
          ...chunkData,
        });
      }
    }
  }

  console.log(chark.blue(`Embedding ${dataToBeEmbed.length} data...`));

  for (const chunks of chunkArray(dataToBeEmbed)) {
    const embeddingRes = await embeddingClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: chunks.map((c) => `${c.type} title: ${c.summary}. ${c.value}`),
    });

    embeddingRes.data.forEach((embedding, index) => {
      result.push({
        ...chunks[index],
        embedding: embedding.embedding,
        model: embeddingRes.model,
      });
    });

    console.log(chark.blue(`Embedded ${chunks.length} data chunk...`));
  }
  writeToFile(EMBEDDED_DATA_PATH, JSON.stringify(result));

  console.log(chark.green(`Embedding data completed`));
}

await embedData();
