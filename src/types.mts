export type RagDocType = "Request" | "Article";

export type RagQueryMode = "rag" | "search";

export type IsUpdatedResponse<T> = {
  data: T;
  isUpdated: boolean;
};

export interface RagChunkedData {
  source: string;
  documents: RagDocument[];
  timestamp: string;
}

export interface RagDocument {
  id: string;
  type: RagDocType;
  title: string;
  keywords?: string;
  description?: string;
  content?: string;
  updatedAt?: string;
  chunks: RagChunkItem[] | null;
}

export interface RagChunkItem {
  value: string;
  hash: string;
}

export interface RagEmbeddedData {
  model: string;
  data: RagEmbeddedChunk[];
  timestamp: string;
}

export interface RagEmbeddedChunk {
  id: string;
  type: RagDocType;
  title: string;
  value: string;
  hash: string;
  embedding: number[];
}

export interface RagQueryResult {
  query: string;
  embeddingResponse?: any;
  llmResponse?: any;
  messages?: any;
  retrievedDocs?: RagRetrievedDoc[];
}

export interface RagRetrievedDoc extends RagEmbeddedChunk {
  similarity: number;
  matchType: "keyword" | "embedding";
}

export interface RagQueryReference {
  id: string;
  type: string;
  value?: string;
  title?: string;
  keywords?: string;
  description?: string;
  updatedAt?: string;
}

export interface RagQueryResponse {
  rawResponse: string;
  response: string;
  query?: string | null;
  documents: RagRetrievedDoc[];
  references: RagQueryReference[];
  mode: RagQueryMode;
  isError?: boolean;
}
