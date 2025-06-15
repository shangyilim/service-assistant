'use server';
/**
 * @fileOverview Defines a Firestore retriever for the 'services' collection.
 */

import { defineFirestoreRetriever } from '@genkit-ai/firebase';
import { initializeApp, getApps, getApp as getAdminApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import type { ServiceItem } from '@/types';

// Ensure Firebase Admin is initialized only once
if (!getApps().length) {
  initializeApp();
}
const firestore = getFirestore(getAdminApp());

export const serviceRetriever = defineFirestoreRetriever<ServiceItem>(ai, {
  name: 'serviceRetriever',
  firestore,
  collection: 'services',
  contentField: 'description', // Primary text field for the document
  vectorField: 'embedding',    // Field containing vector embeddings
  embedder: ai.embedder('googleai/text-embedding-004'), // Embedder used for querying
  distanceMeasure: 'COSINE',
});
