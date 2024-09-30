import chark from "chalk";
import { htmlToText } from "html-to-text";
import { sha256inb64 } from "../utils.mjs";
import { RagChunkedData, RagDocument } from "../types.mjs";

export async function chunkData(
  chunkedData: RagChunkedData
): Promise<RagChunkedData> {
  console.log(chark.green("Chunking data started..."));

  const result: RagDocument[] = [];

  for (const data of chunkedData.documents) {
    if (!data.chunks) {
      data.chunks = [];

      if (data.content) {
        for (const chunk of chunkBySentencesAndCharacters(
          data.content,
          3,
          200
        )) {
          data.chunks.push({
            value: chunk,
            hash: sha256inb64(data.id + data.summary + chunk),
          });
        }
      }

      console.log(chark.blue(`Chunked "${data.id}"...`));
    }

    result.push(data);
  }

  console.log(chark.green(`Chunking data completed`));

  return {
    ...chunkedData,
    documents: result,
  };
}

// Function to convert HTML to plain text
function convertHtmlToPlainText(html: string) {
  return htmlToText(html, {
    wordwrap: false, // Prevent line wrapping
    preserveNewlines: false, // Strip any extra newlines
  });
}

// Function to chunk plain text by sentences with a max sentence and character limit
function chunkBySentencesAndCharacters(
  rawText: string,
  maxSentences: number,
  maxCharacters: number
) {
  const text = convertHtmlToPlainText(rawText);
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g); // Split by sentence-ending punctuation
  const chunks: string[] = [];
  let chunk = "";
  let sentenceCount = 0;

  sentences?.forEach((sentence) => {
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
