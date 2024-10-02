import chark from "chalk";
import { htmlToText } from "html-to-text";
import { sha256inb64 } from "../utils.mjs";
import { IsUpdatedResponse, RagChunkedData, RagDocument } from "../types.mjs";

export async function chunkData(
  chunkedData: RagChunkedData
): Promise<IsUpdatedResponse<RagChunkedData>> {
  let isUpdated = false;

  console.log(chark.green("Chunking data started..."));

  const result: RagDocument[] = [];

  for (const data of chunkedData.documents) {
    if (!data.chunks) {
      data.chunks = [];

      if (data.content) {
        for (const chunk of chunkBySentencesAndCharacters(data.content)) {
          data.chunks.push({
            value: chunk,
            hash: sha256inb64(data.id + data.title + chunk),
          });
        }
      }

      console.log(chark.blue(`Chunked "${data.id}"...`));

      isUpdated = true;
    }

    result.push(data);
  }

  console.log(chark.green(`Chunking data completed`));

  return {
    data: {
      ...chunkedData,
      documents: result,
    },
    isUpdated,
  };
}

// Function to convert HTML to plain text
function convertHtmlToPlainText(html: string) {
  return htmlToText(html, {
    wordwrap: false, // Prevent line wrapping
    preserveNewlines: false, // Strip any extra newlines
  });
}

function chunkBySentencesAndCharacters(
  rawText: string,
  maxSentences = 2,
  maxCharacters = 250,
  minCharacters = 50
): string[] {
  const sentences = splitIntoSentences(convertHtmlToPlainText(rawText));

  const chunks: string[] = [];
  let currentChunk = "";
  let currentSentencesCount = 0;
  let currentCharactersCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    if (
      (currentSentencesCount + 1 > maxSentences ||
        currentCharactersCount + sentenceLength > maxCharacters) &&
      currentCharactersCount >= minCharacters
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
      currentSentencesCount = 0;
      currentCharactersCount = 0;
    }

    currentChunk += sentence + " ";
    currentSentencesCount++;
    currentCharactersCount += sentenceLength;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function splitIntoSentences(text: string): string[] {
  // Regular expression to split text into sentences.
  const sentenceEndings = /(?<=[.!?])\s+(?=[A-Z])/g;
  let roughSentences = text.split(sentenceEndings);

  // Adjust sentences to include ending punctuation within 10 characters.
  for (let i = 1; i < roughSentences.length; i++) {
    const prevSentence = roughSentences[i - 1];
    const currentSentence = roughSentences[i];
    const lookBehindLength = Math.min(10, currentSentence.length);
    const lookBehindText = currentSentence.slice(0, lookBehindLength);

    // Check if there's ending punctuation in the look-behind text.
    const endingPunctuationIndex = lookBehindText.search(/[.!?]/);
    if (endingPunctuationIndex !== -1) {
      // Adjust the previous sentence.
      roughSentences[i - 1] =
        prevSentence + lookBehindText.slice(0, endingPunctuationIndex + 1);
      // Adjust the current sentence.
      roughSentences[i] = currentSentence.slice(endingPunctuationIndex + 1);
    }
  }

  // Clean up any empty sentences after adjustment.
  return roughSentences.filter((sentence) => sentence.trim().length > 0);
}
