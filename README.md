# Local RAG Chatbot POC

This is a CLI-based chatbot project that uses OpenAI models for embedding data and generating responses. The project supports chunking and embedding data for efficient retrieval and then querying the data using a chatbot interface.

## Prerequisites

- Node.js (v20 or higher)
- OpenAI API key (Ensure you have access to OpenAI models for both embedding and response generation)

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

- **Usage:** Launches the chatbot that can answer queries by leveraging the previously embedded data and OpenAI models for response generation.

## How it Works

1. **Data Processing:** The `chunk-data` script splits large datasets into smaller chunks for efficient handling.
2. **Embedding Data:** The `embed-data` script converts the chunked data into vector embeddings using OpenAI's embedding model.
3. **Querying:** The chatbot, powered by the `query-data` script, leverages both the embeddings and OpenAI models to provide relevant answers based on the user's queries.

## Example CLI commands

1. Prepare your dataset:

   ```bash
   npm run prep
   ```

2. Embed the chunked data:

   ```bash
   npm run embed
   ```

3. Start the chatbot and interact:
   ```bash
   npm query
   ```
