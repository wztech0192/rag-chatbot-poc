import readline from "readline";
import fs from "fs";
import chark from "chalk";
import {
  chatbotClient,
  EMBEDDED_DATA_PATH,
  EMBEDDING_MODEL,
  embeddingClient,
  loadJSON,
  RAG_MAX_REQUEST_RESULT,
  RAG_MAX_RESULT,
  SIMILARITY_THRESHOLD,
} from "./utils.mjs";

const embeddedData = loadJSON(EMBEDDED_DATA_PATH);

// Create an interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to simulate query process
async function queryData(query) {
  if (!embeddedData) {
    console.log(chark.red("No embedding data found. Please embed data first."));
    promptUser();
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

  const allRetrievedDocs = embeddedData
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

  const retrievedDocs = [...retrievedNonRequestDocs, ...retrievedRequestDocs];

  // 3. Feed RAG result to chatbot
  // console.log(
  //   chark.grey(
  //     `3/3: Generating a response using ${retrievedDocs.length} retrieved documents...`
  //   )
  // );

  const retrievedDocsContent = Object.values(
    retrievedDocs.reduce((acc, r) => {
      // group by id first
      if (!acc[r.id]) {
        acc[r.id] = [];
      }
      acc[r.id].push(r);
      return acc;
    }, {})
  )
    // merge all chunks belonging to the same document into one
    .map((list, i) => {
      const ref = list[0];

      const docContent = [
        `Retrieved Document ${i + 1}:`,
        `- ID: ${ref.id}`,
        `- Type: ${ref.type}`,
        `- Summary: ${ref.summary}`,
      ];

      const detail = list.map((r) => r.chunk).join(".");
      if (ref.summary !== detail) {
        docContent.push(`- Detail: ${detail}`);
      }

      return docContent.join("\n");
    })
    .join("\n\n");

  const result = await chatbotClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are an expert assistant for a 311 system. 
          You should answer questions using only the provided content from the retrieved documents. 
          However, if the user asks simple, common questions such as greetings (e.g., "Hello", "How are you?"), feel free to respond appropriately.
          Do not make up or provide any information that is not explicitly found in the retrieved documents.
          If the user asks a question unrelated to the content of the retrieved documents and it is not a greeting, politely inform them that the information is not available.
          When generating your response, ensure that each unique document you reference is included at the end of the response as a list. Each reference should follow this format: \`$$<TYPE>_<ID>_<SUMMARY>$$\`. 
          When there is a Request type, also mention the Request.
        `,
      },
      {
        role: "system",
        content: `Retrieved Documents:\n${retrievedDocsContent}`,
      },

      {
        role: "user",
        content: query,
      },
    ],
  });

  fs.writeFileSync(
    `./query-results/${new Date().getTime()}.json`,
    JSON.stringify(
      {
        query,
        response: result,
        documentText: retrievedDocsContent,
        retrievedDocs: retrievedNonRequestDocs.map((d) => ({
          id: d.id,
          type: d.type,
          similarity: d.similarity,
          summary: d.summary,
          chunk: d.chunk,
        })),
        retrievedRequestDocs: retrievedRequestDocs.map((d) => ({
          id: d.id,
          type: d.type,
          similarity: d.similarity,
          summary: d.summary,
          chunk: d.chunk,
        })),
      },
      null,
      2
    )
  );

  console.log(
    chark.greenBright(`Bot:\n${result.choices[0].message.content}\n`)
  );
  promptUser(); // Continue prompting after querying
}

// Function to continuously prompt the user for input
async function promptUser() {
  await rl.question("You:\n", async (inputArg) => {
    if (inputArg.toLowerCase() === "quit") {
      console.log(chark.green("Exiting..."));
      rl.close(); // Close the input stream and exit
    } else {
      await queryData(inputArg); // Treat it as a query
    }
  });
}

// Start the loop
await promptUser();

const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, index) => sum + a * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};
