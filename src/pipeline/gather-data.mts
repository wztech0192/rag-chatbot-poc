import chark from "chalk";
import { IsUpdatedResponse, RagChunkedData, RagDocument } from "../types.mjs";
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

interface RequestType {
  requestTypeSearchName: string;
  requestTypeName: string;
  requestTypeKeywords: string; // separated by ;
  requestTypeId: string;
  description: string;
}

interface ArticleType {
  title: string;
  description: string;
  keywords?: string;
  lastModifiedDate?: string;
  articleVisibility?: string;
  articleVersionid?: string;
  articleNumber?: string;
  publicationStatus?: string;
  articleType?: string;
  knowledgeArticleId: string;
}

export async function gatherData(
  chunkedData: RagChunkedData
): Promise<IsUpdatedResponse<RagChunkedData>> {
  const existingDataMap = chunkedData.documents.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {} as Record<string, RagDocument>);

  console.log(chark.green("Gathering resource data started..."));

  const { result: articles, isUpdated: isArticlesUpdated } =
    await fetchArticles(existingDataMap);

  const { result: requests, isUpdated: isRequestsUpdated } =
    await fetchRequests(existingDataMap);

  const documents = requests.concat(articles);

  console.log(
    chark.green(`Gathered ${documents.length} resource data completed...`)
  );

  return {
    data: {
      source: SF_BASE_URL,
      timestamp: new Date().toISOString(),
      documents,
    },
    isUpdated: isArticlesUpdated || isRequestsUpdated,
  };
}

async function fetchRequests(resourceDataMap: Record<string, RagDocument>) {
  let isUpdated = false;
  console.log(chark.blue(`Fetching request metadata...`));

  const res = await fetch(new URL(REQUEST_METADATA_PATH, SF_BASE_URL));
  const requestTypes: RequestType[] = (await res.json()).data;

  const result: RagDocument[] = [];

  for (const rt of requestTypes) {
    const existingRt = resourceDataMap[rt.requestTypeId];
    const reuseChunks =
      !existingRt ||
      existingRt.title !== rt.requestTypeName ||
      existingRt.content !== rt.description
        ? null
        : existingRt.chunks;

    if (!reuseChunks) {
      console.log(chark.blue(`Upsert ${rt.requestTypeId}...`));
      isUpdated = true;
    }

    result.push({
      id: rt.requestTypeId,
      type: "Request",
      title: rt.requestTypeName,
      description: rt.description,
      content: rt.description,
      keywords: rt.requestTypeKeywords,
      updatedAt: new Date().toISOString(),
      chunks: reuseChunks,
    });
  }

  console.log(chark.blue(`Fetched ${result.length} metadata...`));

  return {
    result,
    isUpdated,
  };
}

async function fetchArticles(resourceDataMap: Record<string, RagDocument>) {
  let isUpdated = false;
  console.log(chark.blue(`Fetching article metadata...`));
  const articleData: RagDocument[] = [];

  const res = await fetch(new URL(ARTICLE_METADATA_PATH, SF_BASE_URL), {
    headers: FETCH_ARTICLE_HEADERS,
  });

  const articleTypes: ArticleType[] = (await res.json()).data;
  console.log(chark.blue(`Fetched ${articleTypes.length} article metadata...`));

  for (const articleType of articleTypes) {
    try {
      const existingArticleData =
        resourceDataMap[articleType.knowledgeArticleId];

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
        if (!articleDetail?.data?.articleContent) {
          throw new Error(
            `Failed to fetch article ${articleType.knowledgeArticleId} content detail`
          );
        }

        articleData.push({
          id: articleType.knowledgeArticleId,
          type: "Article",
          title: articleType.title,
          description: articleType.description,
          content: articleDetail.data.articleContent || articleType.description,
          updatedAt: articleType.lastModifiedDate,
          keywords: articleType.keywords,
          chunks: null,
        });
        console.log(
          chark.blue(
            `Upsert ${articleType.knowledgeArticleId} article detail...`
          )
        );
        isUpdated = true;
      }
    } catch (err) {
      console.error(err);
      console.log(
        chark.red(
          `Failed to fetch article content ${articleType.knowledgeArticleId}`
        )
      );
    }
  }

  return { result: articleData, isUpdated };
}
