import {
  createDocLink,
  createInstructionMessages,
  createRequestStatusWidget,
} from "../create-instructions.mjs";
import { cosineSimilarity } from "../utils.mjs";
import DataRepository from "../repo/DataRepository.mjs";
import {
  EMBEDDING_MODEL,
  embeddingClient,
  FORCE_QUERY_MODE,
  LLM_MODEL,
  llmClient,
  QUERY_TOP_N_REQUEST_RESULT,
  QUERY_TOP_N_RESULT,
  SEARCH_MAX_INPUT_CHARS,
  SIMILARITY_THRESHOLD,
} from "../config.mjs";
import { ChatCompletionMessageParam } from "openai/resources/index";
import {
  RagQueryMode,
  RagQueryReference,
  RagQueryResponse,
  RagRetrievedDoc,
} from "../types.mjs";

export type RagQueryContext = {
  query: string;
  imageBase64?: string;
  dataRepo: DataRepository;
  mode?: RagQueryMode;
};

// Function to simulate query process
export async function queryData(
  ctx: RagQueryContext
): Promise<RagQueryResponse> {
  if (FORCE_QUERY_MODE) {
    ctx.mode = FORCE_QUERY_MODE as RagQueryMode;
  }

  const { query, mode = "rag", imageBase64 } = ctx;

  if (query.length > SEARCH_MAX_INPUT_CHARS) {
    return {
      mode,
      isError: true,
      documents: [],
      references: [],
      query,
      response:
        "Your query is too long. Please try to be more concise and specific.",
    };
  }

  try {
    if (imageBase64) {
      await populateQueryFromImage(ctx);
    }

    let isFallback = false;

    const keywordResult = await createKeywordSearchResponse(ctx);

    // perform keyword search first, if no result, then perform other search

    if (keywordResult) {
      return keywordResult;
    }

    if (mode === "rag") {
      const ragRes = await createRagResponse(ctx);
      if (ragRes !== null) {
        return ragRes;
      } else {
        isFallback = true;
      }
    }

    if (isFallback || mode === "search") {
      const searchRes = await createEmbeddingSearchResponse(ctx);
      if (searchRes !== null) {
        return searchRes;
      }
    }
  } catch (err) {
    console.error(err);
  }

  return {
    mode,
    isError: true,
    documents: [],
    references: [],
    query,
    response:
      "Oops, we've encountered an unexpected issue. Please give it another shot later, or contact support if the problem persists.",
  };
}

/**
 * Generate query response using Retrieval Augmented Generation (RAG) technique
 */
async function createRagResponse(
  ctx: RagQueryContext
): Promise<RagQueryResponse | null> {
  try {
    const { query, dataRepo } = ctx;

    const { allRetrievedDocs, embeddedQueryRes } = await getRetrievedDocs(ctx);

    const retrievedNonRequestDocs = allRetrievedDocs
      .filter(
        (d) => d.type !== "Request" && d.similarity > SIMILARITY_THRESHOLD
      )
      .slice(0, QUERY_TOP_N_RESULT);

    const retrievedRequestDocs = allRetrievedDocs
      .filter(
        (d) => d.type === "Request" && d.similarity > SIMILARITY_THRESHOLD
      )
      .slice(0, QUERY_TOP_N_REQUEST_RESULT);

    const retrievedDocs = [
      ...retrievedNonRequestDocs,
      ...retrievedRequestDocs,
    ].sort((a, b) => b.similarity - a.similarity);

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
      retrievedDocs,
    });

    return {
      query,
      response: result.choices[0].message.content,
      documents: retrievedDocs,
      mode: "rag",
      references: await generateRefs(ctx, retrievedDocs),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Generate query response using keyword search
 * @param ctx
 */
async function createKeywordSearchResponse(
  ctx: RagQueryContext
): Promise<RagQueryResponse | null> {
  try {
    const { query, dataRepo } = ctx;
    const chunkedData = await dataRepo.getChunkedDataAsync();

    const loweredQuery = query.toLowerCase();

    // ignore "hi"... why not?
    if (loweredQuery === "hi") {
      return null;
    }

    // check if query is a 311 request number
    if (query.match(/^([0-9]{5,})$/)) {
      return {
        query,
        response:
          "Request number detected. Here is the status of the request.\n" +
          createRequestStatusWidget(query),
        documents: [],
        mode: "search",
        references: [],
      };
    }

    // try to perform keyword search first. If any result, then return the keyword search result
    const keywordSearchResult: RagRetrievedDoc[] = chunkedData.documents
      .filter(
        (d) =>
          d.keywords?.toLowerCase().includes(loweredQuery) ||
          d.title?.toLowerCase().includes(loweredQuery) ||
          d.id.toLowerCase() === loweredQuery ||
          d.description?.toLowerCase().includes(loweredQuery)
      )
      .map(
        (d) =>
          ({
            id: d.id,
            title: d.title,
            type: d.type,
            matchType: "keyword",
            similarity: 1,
            value: "",
            hash: "",
            embedding: [],
          } as RagRetrievedDoc)
      )
      .slice(0, QUERY_TOP_N_RESULT * 2);

    if (!keywordSearchResult.length) {
      return null;
    }

    return {
      query,
      response:
        "Here is some relevant information matching your query keyword.\n" +
        keywordSearchResult
          .map((r) => createDocLink(r.type, r.id, r.title))
          .join("\n"),
      documents: [],
      mode: "search",
      references: await generateRefs(ctx, keywordSearchResult),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Generate query response using vector embedding search
 * @param ctx
 */
async function createEmbeddingSearchResponse(
  ctx: RagQueryContext
): Promise<RagQueryResponse | null> {
  try {
    const { query } = ctx;

    const { allRetrievedDocs } = await getRetrievedDocs(ctx);

    const groupedDocs = Object.values(
      allRetrievedDocs.reduce((acc, d) => {
        if (!acc[d.id]) {
          acc[d.id] = {
            ...d,
            matchType: "embedding",
            value: "",
            hash: "",
            embedding: [],
          };
        } else {
          acc[d.id].similarity = Math.max(acc[d.id].similarity, d.similarity);
        }
        return acc;
      }, {} as Record<string, RagRetrievedDoc>)
    );

    const retrievedDocs = groupedDocs
      .filter((d) => d.similarity > SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, QUERY_TOP_N_RESULT);

    return {
      query,
      response:
        "Here is some relevant information based on your query\n" +
        retrievedDocs
          .map((r) => createDocLink(r.type, r.id, r.title))
          .join("\n"),
      documents: retrievedDocs,
      mode: "search",
      references: await generateRefs(ctx, retrievedDocs),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * Populate ctx.query by describing ctx.base64Image
 */
async function populateQueryFromImage(ctx: RagQueryContext) {
  const { imageBase64, dataRepo } = ctx;

  // Use AI model to describe the image
  const imageRes = await llmClient.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: "system",
        content: `Do not mention "the image". Describe the image clearly in no more than 50 tokens, focusing on key elements relevant to 311 service requests or articles. Focus on the description without including instructions or actions.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url" as any,
            image_url: {
              url: imageBase64,
              detail: "low",
            } as any,
          },
        ],
      },
    ],
    max_tokens: 200,
  });

  ctx.query =
    imageRes?.choices[0]?.message?.content || "Unable to describe image.";

  dataRepo.logQueryResult({
    query: "Upload Image",
    llmResponse: imageRes,
  });

  return imageRes;
}

async function generateRefs(
  { dataRepo }: RagQueryContext,
  retrievedDocs: RagRetrievedDoc[]
) {
  const chunkedData = await dataRepo.getChunkedDataAsync();

  const existingDataMap = chunkedData.documents.reduce((acc, r) => {
    acc[r.id] = {
      id: r.id,
      type: r.type,
      title: r.title,
      keywords: r.keywords,
      description: r.description,
      updatedAt: r.updatedAt,
    };
    return acc;
  }, {} as Record<string, RagQueryReference>);

  const refIds = new Set(retrievedDocs.map((d) => d.id));

  return Array.from(refIds)
    .map((id) => existingDataMap[id])
    .filter(Boolean);
}

async function getRetrievedDocs({ query, dataRepo }: RagQueryContext) {
  const embeddedData = await dataRepo.getEmbeddedDataAsync();

  // 1. convert query into embedding
  const embeddedQueryRes = await embeddingClient.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  // 2. cosine similarity compare
  const queryEmbedding = embeddedQueryRes.data[0].embedding;

  const allRetrievedDocs = embeddedData.data
    .map(
      (d) =>
        ({
          ...d,
          embedding: [],
          similarity:
            d.embedding?.length > 0
              ? cosineSimilarity(queryEmbedding, d.embedding)
              : 0,
          matchType: "embedding",
        } as RagRetrievedDoc)
    )
    .sort((a, b) => b.similarity - a.similarity);

  return {
    allRetrievedDocs,
    embeddedQueryRes,
  };
}
