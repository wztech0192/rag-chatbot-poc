import chark from "chalk";

const FETCH_ARTICLE_HEADERS = {
  lastmodifiedtimestamp: "2020-12-26T19:18:32.000Z",
  visibility: "public",
};

export async function fetchData(resourceData) {
  console.log(chark.green("Fetching resource data started..."));

  const resourceDataMap = resourceData.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {});

  const articles = await fetchArticles(resourceDataMap);

  const requests = await fetchRequests(resourceDataMap);

  const result = requests.concat(articles);
  console.log(
    chark.green(`fetched ${result.length} resource data completed...`)
  );

  return result;
}

async function fetchRequests(resourceDataMap) {
  console.log(chark.blue(`Fetching request metadata...`));

  const res = await fetch(process.env.REQUEST_TYPE_URL);
  const requestTypes = (await res.json()).data;

  const result = [];

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

async function fetchArticles(resourceDataMap) {
  console.log(chark.blue(`Fetching article metadata...`));

  const res = await fetch(process.env.ARTICLE_URL, {
    headers: FETCH_ARTICLE_HEADERS,
  });

  const articleTypes = (await res.json()).data;
  console.log(chark.blue(`Fetched ${articleTypes.length} article metadata...`));

  const articleData = [];

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
        `${process.env.ARTICLE_DETAIL_URL}/${articleType.knowledgeArticleId}`,
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
