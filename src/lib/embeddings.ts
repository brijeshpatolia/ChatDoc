import { OpenAIApi, Configuration } from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input text for embeddings.');
  }

  // Ensure input length is within API limits
  const maxTokens = 8191;
  const truncatedText = text.length > maxTokens ? text.slice(0, maxTokens) : text;

  try {
    const response = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: truncatedText.replace(/\n/g, ' '), // Replace newlines with spaces
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error: ${response.status} - ${response.statusText}`, errorBody);
      throw new Error(`Failed to get embeddings: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      console.error('Unexpected response format:', result);
      throw new Error('Response does not contain a valid data array.');
    }

    return result.data.map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    console.error('Error calling OpenAI embeddings API:', error);
    throw error;
  }
}
