import { config } from "dotenv";
import { OpenAI, AzureOpenAI } from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
config();

export const RESOURCE_DATA_PATH = "../resource-data.json";
export const PROCESSED_DATA_PATH = "../storage/processed-data.json";
export const EMBEDDED_DATA_PATH = "../storage/embedded-data.json";
export const QUERY_RESULT_PATH = "../query-results/";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const SIMILARITY_THRESHOLD = 0.2;
export const RAG_MAX_RESULT = 5;
export const RAG_MAX_REQUEST_RESULT = 3;

export const chatbotClient = new AzureOpenAI({
  endpoint: "https://inst-azure-openai-01.openai.azure.com/",
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2023-03-15-preview",
  deployment: "do311-gpt-4o-mini",
});

export const embeddingClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const loadJSON = async (path) => {
  try {
    return JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const writeToFile = (filePath, data) => {
  filePath = fileURLToPath(new URL(filePath, import.meta.url));
  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, { recursive: true });

  fs.writeFileSync(filePath, data);
};
