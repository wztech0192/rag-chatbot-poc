import chark from "chalk";

import { createInstructionMessages } from "../create-instructions.mjs";
import { cosineSimilarity } from "../utils.mjs";
import DataRepository from "../repo/DataRepository.mjs";
import {
  EMBEDDING_MODEL,
  embeddingClient,
  LLM_MODEL,
  llmClient,
  RAG_MAX_REQUEST_RESULT,
  RAG_MAX_RESULT,
  SIMILARITY_THRESHOLD,
} from "../config.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index";

// Function to simulate query process
export async function queryData(query: string, dataRepo: DataRepository) {
  const embeddedData = await dataRepo.getEmbeddedDataAsync();

  if (!embeddedData.data.length) {
    console.log(chark.red("No embedding data found. Please embed data first."));
    return;
  }

  // console.log(chark.grey(`---Processing query---`));
  // 1. convert query into embedding
  // console.log(chark.grey(`1/3: Embedding the query text...`));
  const embeddedQueryRes = await embeddingClient.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  // 2. cosine similarity compare
  // console.log(chark.grey(`2/3: Retrieving the top embedding results...`));
  const queryEmbedding = embeddedQueryRes.data[0].embedding;

  const allRetrievedDocs = embeddedData.data
    .map((d) => ({
      ...d,
      similarity:
        d.embedding?.length > 0
          ? cosineSimilarity(queryEmbedding, d.embedding)
          : 0,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const retrievedNonRequestDocs = allRetrievedDocs
    .filter((d) => d.type !== "Request" && d.similarity > SIMILARITY_THRESHOLD)
    .slice(0, RAG_MAX_RESULT);

  const retrievedRequestDocs = allRetrievedDocs
    .filter((d) => d.type === "Request" && d.similarity > SIMILARITY_THRESHOLD)
    .slice(0, RAG_MAX_REQUEST_RESULT);

  const retrievedDocs = [
    ...retrievedNonRequestDocs,
    ...retrievedRequestDocs,
  ].sort((a, b) => b.similarity - a.similarity);

  // 3. Feed RAG result to chatbot
  // console.log(
  //   chark.grey(
  //     `3/3: Generating a response using ${retrievedDocs.length} retrieved documents...`
  //   )
  // );

  const messages: ChatCompletionMessageParam[] = [
    ...createInstructionMessages(retrievedDocs),
    {
      role: "user",
      content: query,
    },
  ];

  const result = await llmClient.chat.completions.create({
    model: LLM_MODEL,
    messages,
  });

  dataRepo.logQueryResult({
    query,
    embeddingResponse: {
      usage: embeddedQueryRes.usage,
      embeddingModel: embeddedQueryRes.model,
    },
    llmResponse: result,
    messages,
    retrievedDocs: retrievedNonRequestDocs.map((d) => ({
      id: d.id,
      type: d.type,
      similarity: d.similarity,
      summary: d.summary,
      value: d.value,
      hash: d.hash,
    })),
    retrievedRequestDocs: retrievedRequestDocs.map((d) => ({
      id: d.id,
      type: d.type,
      similarity: d.similarity,
      summary: d.summary,
      value: d.value,
      hash: d.hash,
    })),
  });

  return result;
}
