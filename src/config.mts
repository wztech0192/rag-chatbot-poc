import OpenAI, { AzureOpenAI } from "openai";

export const SF_BASE_URL = process.env.IA_SALESFORCE_BASE_URL ?? "N/A";

export const ARTICLE_METADATA_PATH =
  process.env.IA_ARTICLE_METADATA_PATH ?? "N/A";
export const ARTICLE_DETAIL_PATH = process.env.IA_ARTICLE_DETAIL_PATH ?? "N/A";
export const REQUEST_METADATA_PATH =
  process.env.IA_REQUEST_METADATA_PATH ?? "N/A";

export const EMBEDDING_MODEL = process.env.IA_EMBEDDING_MODEL ?? "N/A";
export const LLM_MODEL = process.env.IA_LLM_MODEL ?? "N/A";

export const SIMILARITY_THRESHOLD =
  parseFloat(process.env.IA_SEARCH_DEFAULT_SIMILARITY_THRESHOLD ?? "") || 0.25;

export const SEARCH_MAX_INPUT_CHARS =
  parseInt(process.env.IA_SEARCH_MAX_INPUT_CHARS ?? "") || 250;

export const QUERY_TOP_N_RESULT =
  parseInt(process.env.IA_QUERY_TOP_N_RESULT ?? "") || 5;

export const QUERY_TOP_N_REQUEST_RESULT =
  parseInt(process.env.IA_QUERY_TOP_N_REQUEST_RESULT ?? "") || 3;

export const S3_BUCKET = process.env.IA_S3_BUCKET;
export const S3_REGION = process.env.IA_S3_REGION;
export const S3_ENDPOINT = process.env.IA_S3_ENDPOINT;

export const llmClient = new AzureOpenAI({
  endpoint: process.env.IA_AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.IA_AZURE_OPENAI_API_KEY,
  apiVersion: "2023-03-15-preview",
  deployment: process.env.IA_AZURE_LLM_MODEL_DEPLOYMENT,
});

export const embeddingClient = new OpenAI({
  apiKey: process.env.IA_OPENAI_API_KEY,
});
