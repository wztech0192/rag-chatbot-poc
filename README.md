# Local RAG Chatbot POC

This is a CLI-based chatbot project that uses OpenAI models for embedding data and generating responses. The project supports chunking and embedding data for efficient retrieval and then querying the data using a chatbot interface.

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key (Ensure you have access to OpenAI models for both embedding and response generation)
- High RAM capacity as the vector searching is done in-memory.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd <project-directory>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Clone the `.env.example` file and rename it to `.env`:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your OpenAI API key:

## Scripts

The project includes the following CLI commands:

### Process Data

Chunks large datasets into smaller pieces for efficient embedding.

```bash
npm run process-data
```

- **Usage:** Prepare data for embedding by splitting large datasets into manageable chunks.

### Embed Data

Embeds the chunked data using OpenAI models for future querying.

```bash
npm run embed-data
```

- **Usage:** Embed the processed data into vector format to enable efficient retrieval during chatbot interactions.

### Start the Chatbot

Starts the chatbot interface, allowing you to query the embedded data.

```bash
npm start
```

- **Usage:** Launches the chatbot that can answer queries by leveraging the previously embedded data and OpenAI models for response generation.

## How it Works

1. **Data Processing:** The `process-data` script splits large datasets into smaller chunks for efficient handling.
2. **Embedding Data:** The `embed-data` script converts the chunked data into vector embeddings using OpenAI's embedding model.
3. **Querying:** The chatbot, started with the `start` script, leverages both the embeddings and OpenAI models to provide relevant answers based on the user's queries.

## Example Workflow

1. Process your dataset:

   ```bash
   npm run process-data
   ```

2. Embed the processed data:

   ```bash
   npm run embed-data
   ```

3. Start the chatbot and interact:
   ```bash
   npm start
   ```
