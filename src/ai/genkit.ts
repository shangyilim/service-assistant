import {genkit} from 'genkit/beta';
import {googleAI} from '@genkit-ai/googleai';
import { AgentSessionState } from './types';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});


ai.defineHelper(
  'userContext',
  (state: AgentSessionState) => `=== Customer Context

- The current date and time is: ${new Date().toString()}
===`
);
