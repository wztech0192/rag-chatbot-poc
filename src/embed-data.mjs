import {
  EMBEDDED_DATA_PATH,
  EMBEDDING_MODEL,
  embeddingClient,
  loadJSON,
  PROCESSED_DATA_PATH,
  writeToFile,
} from "./utils.mjs";
import chark from "chalk";

// Function to simulate training process
async function embedData() {
  console.log(chark.green("Embedding process started..."));

  const processedData = loadJSON(PROCESSED_DATA_PATH);

  if (!processedData) {
    console.log(
      chark.red("No processed data found. Please process data first.")
    );
    promptUser();
    return;
  }

  const result = [];
  for (const data of processedData) {
    const embeddingRes = await embeddingClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: data.embeddingChunks,
    });
    embeddingRes.data.forEach((embedding, index) => {
      result.push({
        id: data.id,
        type: data.type,
        summary: data.summary,
        chunk: data.rawChunks[index],
        embedding: embedding.embedding,
      });
    });
    console.log(chark.blue(`Embedded "${data.id}"...`));
  }

  writeToFile(EMBEDDED_DATA_PATH, JSON.stringify(result, null, 2));

  console.log(chark.green(`Embedding data completed`));
}

await embedData();
