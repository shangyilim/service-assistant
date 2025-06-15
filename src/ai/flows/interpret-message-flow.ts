
'use server';
/**
 * @fileOverview Interprets a user's message to determine intent and necessary parameters for further actions.
 *
 * - interpretMessageFlow - A function that categorizes a user message and extracts relevant data.
 * - InterpretMessageInput - The input type for the interpretMessageFlow function.
 * - InterpretationResult - The output type for the interpretMessageFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const InterpretMessageInputSchema = z.object({
  userMessage: z.string().describe('The message received from the user.'),
});
 type InterpretMessageInput = z.infer<typeof InterpretMessageInputSchema>;

 const InterpretationResultSchema = z.object({
  action: z.enum(['lookupFaq', 'lookupServiceGeneric', 'lookupServiceSpecific', 'directResponse', 'unclear'])
    .describe("The primary action category derived from the user's message. 'lookupFaq' for FAQ searches, 'lookupServiceGeneric' for general service inquiries, 'lookupServiceSpecific' for inquiries about a particular service, 'directResponse' for simple replies like greetings, and 'unclear' if the intent cannot be determined."),
  query: z.string().optional()
    .describe("The specific search query extracted from the user's message, to be used with a lookup tool. For 'lookupServiceGeneric', this could be a general term like 'all services'. For 'directResponse' or 'unclear', this may be omitted."),
  responseText: z.string().optional()
    .describe("A pre-formulated text response. For 'directResponse', this is the full reply. For 'unclear', it's a message asking for clarification. For lookup actions, it can be an acknowledgment (e.g., 'Let me check that for you') or empty if the tool's result will form the entire response."),
});
 type InterpretationResult = z.infer<typeof InterpretationResultSchema>;

const interpretPrompt = ai.definePrompt({
  name: 'interpretUserMessagePrompt',
  input: { schema: InterpretMessageInputSchema },
  output: { schema: InterpretationResultSchema },
  prompt: `You are an AI assistant that interprets user messages to determine the appropriate action and extract necessary information.
Analyze the user's message: {{{userMessage}}}

Determine the user's intent and fill the output fields:
- 'action':
  - If the user is asking a general question that might be in an FAQ (e.g., "What are your hours?", "How do I reset my password?"), set to "lookupFaq".
  - If the user is asking for a list of all available services (e.g., "What services do you offer?", "Show me your services"), set to "lookupServiceGeneric".
  - If the user is asking about a specific service (e.g., "Do you have web design?", "Tell me about your consulting service"), set to "lookupServiceSpecific".
  - If the user message is a simple greeting, salutation, or a statement that doesn't require a lookup (e.g., "Hello", "Thanks", "Okay"), set to "directResponse".
  - If the intent is unclear or the message is ambiguous, set to "unclear".
- 'query':
  - If 'action' is 'lookupFaq' or 'lookupServiceSpecific', extract the core keywords or question from the user's message to be used as the search query. For example, if the message is "Tell me about web design services", the query should be "web design services" or "web design".
  - If 'action' is 'lookupServiceGeneric', you can set this to a general term like "all services" or "available services".
  - Omit or leave empty if 'action' is 'directResponse' or 'unclear' and no specific query is applicable.
- 'responseText':
  - If 'action' is 'directResponse', provide a suitable direct reply (e.g., for "Hello", respond with "Hi there! How can I help you today?").
  - If 'action' is 'unclear', provide a message asking for clarification (e.g., "I'm not sure I understand. Could you please rephrase?").
  - If 'action' involves a lookup, this field can be used for an interim acknowledgment like "Let me check on that for you." or can be left empty if the tool's output will form the complete response.

Examples:
User Message: "What services do you have?"
Output: { "action": "lookupServiceGeneric", "query": "all services", "responseText": "Let me list the services we offer." }

User Message: "Do you offer website development?"
Output: { "action": "lookupServiceSpecific", "query": "website development", "responseText": "I'll check if we offer website development." }

User Message: "What are your office hours?"
Output: { "action": "lookupFaq", "query": "office hours", "responseText": "Let me find out the office hours for you." }

User Message: "Hi"
Output: { "action": "directResponse", "responseText": "Hello! How can I assist you today?" }

User Message: "Thanks!"
Output: { "action": "directResponse", "responseText": "You're welcome!" }

User Message: "Can you help me with something obscure?"
Output: { "action": "unclear", "responseText": "I'm not sure I can help with that. Could you provide more details or ask a different question?" }
`,
});

export async function interpretMessage(input: InterpretMessageInput): Promise<InterpretationResult> {
  return interpretMessageFlow(input);
}

 const interpretMessageFlow = ai.defineFlow(
  {
    name: 'interpretMessageFlow',
    inputSchema: InterpretMessageInputSchema,
    outputSchema: InterpretationResultSchema,
  },
  async (input) => {
    const { output } = await interpretPrompt(input);
    if (!output) {
        // Fallback if LLM fails to produce structured output
        return {
            action: 'unclear',
            responseText: "I'm having a little trouble understanding right now. Please try rephrasing."
        } as InterpretationResult;
    }
    return output;
  }
);
