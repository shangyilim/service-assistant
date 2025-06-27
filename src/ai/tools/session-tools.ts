


import { ai } from '@/ai/genkit';

import type { AgentSessionState } from '../types';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../firebase-service';


export const endSessionTool = ai.defineTool(
    {
        name: 'endSessionTool',
        description: 'Ends the conversation with the customer.',
    },
    async ({ customerName }) => {

        const { id: sessionId, state } = ai.currentSession<AgentSessionState>();


        if (!state) {
            return true;
        }
        const firestore = getFirestore(getFirebaseAdminApp());

        const customerRef = firestore.collection('customers').doc(state.userId);
        // clear the current sessionId, but keep it as last for tracking purposes.
        await customerRef.update({ sessionId: null, lastSessionId: sessionId });

        return true;
    }
);
