import chark from "chalk";
import { loadJSON, RESOURCE_DATA_PATH, writeToFile } from "./utils.mjs";

async function fetchData() {
  const resourceData = await loadJSON(RESOURCE_DATA_PATH);
  console.log(chark.green("Fetching resource data started..."));
  const articles = await fetchArticles();

  const requests = await fetchRequests();

  writeToFile(
    RESOURCE_DATA_PATH,
    JSON.stringify(requests.concat(articles), null, 2)
  );

  console.log(chark.green("Fetching resource data completed..."));
}

async function fetchRequests() {
  const res = await fetch(process.env.REQUEST_TYPE_URL);
  const requestTypes = (await res.json()).data;

  console.log(chark.blue(`Fetched ${requestTypes.length} request types...`));
  return requestTypes.map((rt) => ({
    id: rt.requestTypeId,
    type: "Request",
    summary: rt.requestTypeName,
    content: rt.description,
  }));
}

async function fetchArticles() {
  const res = await fetch(process.env.ARTICLE_URL, {
    headers: {
      lastmodifiedtimestamp: "2020-12-26T19:18:32.000Z",
      visibility: "public",
    },
  });

  const articleTypes = (await res.json()).data;
  console.log(chark.blue(`Fetched ${articleTypes.length} article metadata...`));

  const articleData = [];

  for (const articleType of articleTypes) {
    const articleDetailRes = await fetch(
      `${process.env.ARTICLE_DETAIL_URL}/${articleType.knowledgeArticleId}`,
      {
        headers: {
          lastmodifiedtimestamp: "2020-12-26T19:18:32.000Z",
          visibility: "public",
        },
      }
    );

    const articleDetail = await articleDetailRes.json();

    articleData.push({
      id: articleType.knowledgeArticleId,
      type: "Article",
      summary: articleType.title,
      content: articleDetail.data.articleContent ?? articleType.description,
    });
    console.log(
      chark.blue(`Fetched ${articleType.knowledgeArticleId} article detail...`)
    );
  }

  return articleData;
}

await fetchData();
