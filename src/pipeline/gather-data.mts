import chark from "chalk";
import { RagChunkedData, RagDocument } from "../types.mjs";
import {
  ARTICLE_DETAIL_PATH,
  ARTICLE_METADATA_PATH,
  REQUEST_METADATA_PATH,
  SF_BASE_URL,
} from "../config.mjs";

const FETCH_ARTICLE_HEADERS = {
  lastmodifiedtimestamp: "2020-12-26T19:18:32.000Z",
  visibility: "public",
};

export async function gatherData(
  chunkedData: RagChunkedData
): Promise<RagChunkedData> {
  const existingDataMap = chunkedData.documents.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {} as Record<string, RagDocument>);

  console.log(chark.green("Gathering resource data started..."));

  const articles = await fetchArticles(existingDataMap);

  const requests = await fetchRequests(existingDataMap);

  const documents = requests.concat(articles);

  console.log(
    chark.green(`Gathered ${documents.length} resource data completed...`)
  );

  return {
    source: SF_BASE_URL,
    timestamp: new Date().toISOString(),
    documents,
  };
}

async function fetchRequests(resourceDataMap: Record<string, RagDocument>) {
  console.log(chark.blue(`Fetching request metadata...`));

  const res = await fetch(new URL(REQUEST_METADATA_PATH, SF_BASE_URL));
  const requestTypes = (await res.json()).data;

  const result: RagDocument[] = [];

  for (const rt of requestTypes) {
    const existingRt = resourceDataMap[rt.requestTypeId];
    const reuseChunks =
      !existingRt ||
      existingRt.summary !== rt.requestTypeName ||
      existingRt.content !== rt.description
        ? null
        : existingRt.chunks;

    if (!reuseChunks) {
      console.log(chark.blue(`Upsert ${rt.requestTypeId}...`));
    }

    result.push({
      id: rt.requestTypeId,
      type: "Request",
      summary: rt.requestTypeName,
      content: rt.description,
      keywords: rt.requestTypeKeywords,
      updatedAt: new Date().toISOString(),
      chunks: reuseChunks,
    });
  }

  console.log(chark.blue(`Fetched ${result.length} metadata...`));

  return result;
}

async function fetchArticles(resourceDataMap: Record<string, RagDocument>) {
  console.log(chark.blue(`Fetching article metadata...`));

  const res = await fetch(new URL(ARTICLE_METADATA_PATH, SF_BASE_URL), {
    headers: FETCH_ARTICLE_HEADERS,
  });

  const articleTypes = (await res.json()).data;
  console.log(chark.blue(`Fetched ${articleTypes.length} article metadata...`));

  const articleData: RagDocument[] = [];

  for (const articleType of articleTypes) {
    const existingArticleData = resourceDataMap[articleType.knowledgeArticleId];

    if (
      existingArticleData &&
      existingArticleData.updatedAt === articleType.lastModifiedDate
    ) {
      // reuse
      articleData.push(existingArticleData);
    } else {
      // fetch content

      const articleDetailRes = await fetch(
        `${new URL(ARTICLE_DETAIL_PATH, SF_BASE_URL).toString()}/${
          articleType.knowledgeArticleId
        }`,
        {
          headers: FETCH_ARTICLE_HEADERS,
        }
      );

      const articleDetail = await articleDetailRes.json();

      articleData.push({
        id: articleType.knowledgeArticleId,
        type: "Article",
        summary: articleType.title,
        content: articleDetail.data.articleContent || articleType.description,
        updatedAt: articleType.lastModifiedDate,
        keywords: articleType.keywords,
        chunks: null,
      });
      console.log(
        chark.blue(`Upsert ${articleType.knowledgeArticleId} article detail...`)
      );
    }
  }

  return articleData;
}
