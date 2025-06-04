
'use server';
/**
 * @fileOverview Generates embeddings for text.
 *
 * - generateEmbedding - A function that generates an embedding for a given text.
 * - GenerateEmbeddingInput - The input type for the generateEmbedding function.
 * - GenerateEmbeddingOutput - The return type for the generateEmbedding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateEmbeddingInputSchema = z.object({
  text: z.string().describe('The text to generate an embedding for.'),
});
export type GenerateEmbeddingInput = z.infer<typeof GenerateEmbeddingInputSchema>;

const GenerateEmbeddingOutputSchema = z.object({
  embedding: z.array(z.number()).describe('The generated embedding vector.'),
});
export type GenerateEmbeddingOutput = z.infer<typeof GenerateEmbeddingOutputSchema>;

export async function generateEmbedding(input: GenerateEmbeddingInput): Promise<GenerateEmbeddingOutput> {
  return generateEmbeddingFlow(input);
}

const generateEmbeddingFlow = ai.defineFlow(
  {
    name: 'generateEmbeddingFlow',
    inputSchema: GenerateEmbeddingInputSchema,
    outputSchema: GenerateEmbeddingOutputSchema,
  },
  async (input) => {
    const {output} = await ai.embed({
      model: 'googleai/text-embedding-004', // Explicitly specify the model
      content: input.text,
    });

    if (!output || !output.embedding) {
      console.error('Embedding generation failed or returned no embedding for input:', input.text);
      throw new Error('Embedding generation failed or returned no embedding.');
    }
    return { embedding: output.embedding };
  }
);
