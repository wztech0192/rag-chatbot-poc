import chark from "chalk";
import { htmlToText } from "html-to-text";
import { createHash } from "crypto";

export async function chunkData(resourceData) {
  if (!resourceData) {
    console.log(
      chark.red("No resource data found. Please provide resource data first.")
    );
    return;
  }

  console.log(chark.green("Chunking data started..."));

  const result = [];

  for (const data of resourceData) {
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
            hash: sha256inb64(data.id + chunk),
          });
        }
      }

      console.log(chark.blue(`Chunked "${data.id}"...`));
    }

    result.push(data);
  }

  console.log(chark.green(`Chunking data completed`));

  return result;
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

function sha256inb64(value) {
  const hash = createHash("sha256");
  hash.update(value);
  return hash.digest("base64");
}
