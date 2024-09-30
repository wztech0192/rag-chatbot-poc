import OpenAI, { AzureOpenAI } from "openai";

export const SF_BASE_URL = process.env.SALESFORCE_BASE_URL ?? "N/A";

export const ARTICLE_METADATA_PATH = process.env.ARTICLE_METADATA_PATH ?? "N/A";
export const ARTICLE_DETAIL_PATH = process.env.ARTICLE_DETAIL_PATH ?? "N/A";
export const REQUEST_METADATA_PATH = process.env.REQUEST_METADATA_PATH ?? "N/A";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "N/A";
export const LLM_MODEL = process.env.LLM_MODEL ?? "N/A";

export const SIMILARITY_THRESHOLD = 0.25;
export const RAG_MAX_RESULT = 5;
export const RAG_MAX_REQUEST_RESULT = 3;

export const llmClient = new AzureOpenAI({
  endpoint: "https://inst-azure-openai-01.openai.azure.com/",
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2023-03-15-preview",
  deployment: process.env.LLM_MODEL_AZURE_DEPLOYMENT,
});

export const embeddingClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
