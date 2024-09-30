import { createHash } from "crypto";

export function chunkArray<T>(array: T[], chunkSize = 16) {
  let result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export const sha256inb64 = (value: string, len?: number) => {
  const hash = createHash("sha256");
  hash.update(value);
  const result = hash.digest("base64");

  if (!len) {
    return result;
  }

  return result.slice(0, len);
};

export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, a, index) => sum + a * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};
