import chark from "chalk";
import {
  loadJSON,
  PROCESSED_DATA_PATH,
  RESOURCE_DATA_PATH,
  writeToFile,
} from "./utils.mjs";
import { htmlToText } from "html-to-text";

async function processData() {
  const resourceData = await loadJSON(RESOURCE_DATA_PATH);

  if (!resourceData) {
    console.log(
      chark.red("No resource data found. Please provide resource data first.")
    );
    return;
  }

  console.log(chark.green("Processing data started..."));

  const result = [];

  for (const rss of resourceData) {
    const data = {
      id: rss.id,
      type: rss.type,
      summary: rss.summary,
      content: rss.content,
      embeddingChunks: [],
      rawChunks: [],
    };

    if (rss.content) {
      for (const chunk of chunkBySentencesAndCharacters(rss.content, 3, 200)) {
        data.embeddingChunks.push(
          `${rss.type} title: ${rss.summary}. ${chunk}`
        );
        data.rawChunks.push(chunk);
      }
    }

    result.push(data);

    console.log(chark.blue(`Processed "${rss.id}"...`));
  }

  writeToFile(PROCESSED_DATA_PATH, JSON.stringify(result, null, 2));
  console.log(chark.green(`Processing data completed`));
}

// Function to convert HTML to plain text
function convertHtmlToPlainText(html) {
  return htmlToText(html, {
    wordwrap: false, // Prevent line wrapping
    preserveNewlines: false, // Strip any extra newlines
  });
}

// Function to chunk plain text by sentences with a max sentence and character limit
function chunkBySentencesAndCharacters(rawText, maxSentences, maxCharacters) {
  const text = convertHtmlToPlainText(rawText);
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g); // Split by sentence-ending punctuation
  const chunks = [];
  let chunk = "";
  let sentenceCount = 0;

  sentences.forEach((sentence) => {
    const trimmedSentence = sentence.trim();

    // Check if adding this sentence would exceed the sentence or character limits
    if (
      sentenceCount + 1 > maxSentences ||
      chunk.length + trimmedSentence.length > maxCharacters
    ) {
      // If so, push the current chunk to the result and start a new chunk
      chunks.push(chunk.trim());
      chunk = ""; // Reset chunk
      sentenceCount = 0; // Reset sentence count
    }

    // Add the sentence to the current chunk
    chunk += `${trimmedSentence} `;
    sentenceCount++;
  });

  // Push the last chunk if any content is left
  if (chunk.length > 0) {
    chunks.push(chunk.trim());
  }

  return chunks;
}

await processData();
