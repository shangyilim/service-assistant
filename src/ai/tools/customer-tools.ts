

import { z } from 'zod';
import { ai } from '@/ai/genkit';

import type { AgentSessionState } from '../types';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../firebase-service';


export const customerInfoTool = ai.defineTool(
  {
    name: 'customerInfoTool',
    description: 'Gathers information about the customer name.',
    inputSchema: z.object({
      customerName: z.string().optional().describe('the name of the customer'),
    }),
  },
  async ({ customerName }) => {
    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);

    const state = ai.currentSession<AgentSessionState>().state;

    const customerId = state?.userId;
    if (customerId) {
        ai.currentSession<AgentSessionState>().updateState({
            ...state,
            name: customerName
        });
      await firestore.collection('customers')
        .doc(customerId)
        .update({
          name: customerName,
        });
    }
    return true;
  }
);
