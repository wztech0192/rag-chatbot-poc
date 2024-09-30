export interface RagChunkedData {
  source: string;
  documents: RagDocument[];
  timestamp: string;
}

export interface RagDocument {
  id: string;
  type: string;
  summary: string;
  keywords: string;
  content: string;
  updatedAt: string;
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
  type: string;
  summary: string;
  value: string;
  hash: string;
  embedding: number[];
}

export interface RagQueryResult {
  query: string;
  embeddingResponse: any;
  llmResponse: any;
  messages: any;
  retrievedDocs: RagRetrievedDoc[];
  retrievedRequestDocs: RagRetrievedDoc[];
}

export interface RagRetrievedDoc {
  id: string;
  type: string;
  similarity: number;
  summary: string;
  value: string;
  hash: string;
}
