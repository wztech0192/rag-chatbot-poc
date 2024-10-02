import { ChatCompletionMessageParam } from "openai/resources/index";
import { RagEmbeddedChunk } from "./types.mjs";

type RagRetrievedDoc = RagEmbeddedChunk & { similarity: number };

export const RESPONSE_MARKUP_FORMAT = /\$(?<type>[^[]*)\[(?<value>[^\]]*)\]/g;
export const LINK_FORMAT = "$link[<Doc Type>|<Doc ID>|<Doc Summary>]";
export const WIDGET_FORMAT = "$widget[RequestStatus|<RequestNumber>]";

export function createDocLink(
  docType: string,
  docId: string,
  docSummary: string
) {
  return LINK_FORMAT.replace("<Doc Type>", docType)
    .replace("<Doc ID>", docId)
    .replace("<Doc Summary>", docSummary);
}

export function createRequestStatusWidget(requestNumber: string) {
  return WIDGET_FORMAT.replace("<RequestNumber>", requestNumber);
}

export function createInstructionMessages(
  retrievedDocs: RagRetrievedDoc[]
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    // base instruction
    {
      role: "system",
      content: [
        "All response must be in plain text. No markdown. Be concise.",
        "You are an expert assistant for a 311 system.",
        "For simple greetings, feel free to respond appropriately.",
        "For unrelated questions, inform the user that the information is unavailable.",
      ].join(" "),
    },

    // RAG instruction
    {
      role: "system",
      content: (retrievedDocs.length > 0
        ? [
            "Answer questions strictly using information from retrieved documents.",
            "Do not provide information or suggestion not explicitly found in the retrieved documents.",
            `Include retrieved document references at the end of responses in this format: \`${LINK_FORMAT}\`. Each reference should have a new line without any other text.`,
            "Always include the related Request type reference if applicable.\n",
            `Retrieved Documents:\n${createRetrievedDocMessage(retrievedDocs)}`,
          ]
        : [
            `No retrieved information. Inform the user that the information is unavailable.`,
          ]
      ).join(" "),
    },

    // Custom information
    {
      role: "system",
      content: [
        "\nUse the following information if neccesary:",
        `If ask for the status of a existing service request, response at the end of responses in this format: \`${WIDGET_FORMAT}\`.`,
        "Catalyst Consulting Group (CCG) company is based in Chicago, IL.",
        "Tech city is a 311 Demo project created by Catalyst Consulting Group",
      ].join(" "),
    },
  ];

  return messages;
}

const createRetrievedDocMessage = (retrievedDocs: RagRetrievedDoc[]) => {
  const retrievedDocsContent = Object.values(
    retrievedDocs.reduce((acc, r) => {
      // group by id first
      if (!acc[r.id]) {
        acc[r.id] = [];
      }
      acc[r.id].push(r);
      return acc;
    }, {} as Record<string, RagRetrievedDoc[]>)
  )
    // merge all chunks belonging to the same document into one
    .map((list, i) => {
      const ref = list[0];

      const docContent = [
        `Start Retrieved Document ${i + 1}`,
        `ID: ${ref.id}`,
        `Type: ${ref.type}`,
        `Summary: ${ref.title}`,
      ];

      const detail = list.map((r) => r.value).join("\n");
      if (ref.title !== detail) {
        docContent.push(`Detail:\n${detail}`);
      }

      docContent.push(`End Retrieved Document ${i + 1}`);

      return docContent.join("\n");
    })
    .join("\n\n");

  return retrievedDocsContent;
};
