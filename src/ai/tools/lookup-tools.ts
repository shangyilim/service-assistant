
'use server';
/**
 * @fileOverview Defines Genkit tools for looking up FAQs and Services.
 *
 * - lookupFaqTool: A tool to search FAQs in Firestore using Admin SDK.
 * - lookupServiceTool: A tool to search Services in Firestore. Uses Admin SDK for generic lookups
 *   and serviceRetriever (which uses Admin SDK) for specific vector searches.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, getApp as getAdminApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { FaqItem, ServiceItem } from '@/types';
import { serviceRetriever } from '../retrievers/service-retriever'; // Import the Genkit retriever

// Initialize Firebase Admin SDK
let adminApp: App;
let adminDb: Firestore;

if (!getApps().length) {
  adminApp = initializeApp(); // Uses GOOGLE_APPLICATION_CREDENTIALS by default
} else {
  adminApp = getAdminApp();
}
adminDb = getFirestore(adminApp);

// Schema for FAQ Item - used in tool output
const FaqItemZodSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  userId: z.string().optional(),
});

export const LookupFaqInputSchema = z.object({
  query: z.string().describe('The user query to search for in FAQs. Can be a question or keywords.'),
});
export type LookupFaqInput = z.infer<typeof LookupFaqInputSchema>;

export const LookupFaqOutputSchema = z.array(FaqItemZodSchema).nullable().describe('An array of matching FAQ items, or null if an error occurs.');
export type LookupFaqOutput = z.infer<typeof LookupFaqOutputSchema>;

export const lookupFaqTool = ai.defineTool(
  {
    name: 'lookupFaqTool',
    description: 'Searches the knowledge base for relevant FAQs based on a user query.',
    inputSchema: LookupFaqInputSchema,
    outputSchema: LookupFaqOutputSchema,
  },
  async (input) => {
    console.log('lookupFaqTool input:', input);
    if (!input.query || input.query.trim() === "") {
      console.warn("FAQ lookup called with empty query. Returning empty array.");
      return [];
    }
    try {
      const faqsCollectionRef = adminDb.collection('faqs');
      // For Admin SDK, we filter in code after getting all docs, or implement more complex text search if supported by backend.
      // Basic keyword matching:
      const querySnapshot = await faqsCollectionRef.orderBy('question').get();
      const faqs = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FaqItem))
        .filter(faq => 
          faq.question.toLowerCase().includes(input.query.toLowerCase()) || 
          faq.answer.toLowerCase().includes(input.query.toLowerCase())
        )
        .slice(0, 5); // Limit results

      console.log(`Found ${faqs.length} FAQs for query: "${input.query}" using Admin SDK.`);
      return faqs;
    } catch (error) {
      console.error('Error in lookupFaqTool (Admin SDK):', error);
      return null;
    }
  }
);

// Schema for Service Item - used in tool output
const ServiceItemZodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  availability: z.boolean(),
  userId: z.string().optional(),
});

export const LookupServiceInputSchema = z.object({
  queryType: z.enum(['GENERIC', 'SPECIFIC']).describe("Type of query: 'GENERIC' to list all services, 'SPECIFIC' to search for a particular service."),
  query: z.string().optional().describe('The specific user query for a service (used if queryType is SPECIFIC).'),
});
export type LookupServiceInput = z.infer<typeof LookupServiceInputSchema>;

export const LookupServiceOutputSchema = z.array(ServiceItemZodSchema).nullable().describe('An array of matching Service items, or null if an error occurs.');
export type LookupServiceOutput = z.infer<typeof LookupServiceOutputSchema>;

export const lookupServiceTool = ai.defineTool(
  {
    name: 'lookupServiceTool',
    description: "Looks up available services. Use GENERIC queryType to list all services. Use SPECIFIC with a query to find particular services using vector search based on the service's embedding.",
    inputSchema: LookupServiceInputSchema,
    outputSchema: LookupServiceOutputSchema,
  },
  async (input) => {
    console.log('lookupServiceTool input:', input);
    
    try {
      if (input.queryType === 'GENERIC') {
        console.log('Performing GENERIC lookup for all available services using Admin SDK.');
        const servicesCollectionRef = adminDb.collection('services');
        const q = servicesCollectionRef.where('availability', '==', true).orderBy('name');
        const querySnapshot = await q.get();
        const services = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            availability: data.availability,
            userId: data.userId,
          } as ServiceItem;
        });
        console.log(`Found ${services.length} generic services using Admin SDK.`);
        return services.length > 0 ? services : [];
      } else { // SPECIFIC query - use the serviceRetriever
        if (!input.query || input.query.trim() === "") {
          console.warn("Specific service lookup called with empty query. Returning empty array.");
          return [];
        }

        console.log(`Performing SPECIFIC vector search for services with query: "${input.query}" using serviceRetriever.`);
        
        const retrievedDocs = await ai.retrieve({
          retriever: serviceRetriever,
          query: input.query,
          options: {
            where: { availability: true },
          }, // Request up to 5 documents
        });
        
        console.log(`Retrieved ${retrievedDocs.length} documents via serviceRetriever for query: "${input.query}".`);

        const services = retrievedDocs
          .map(doc => {
            // doc.metadata should contain all fields from the Firestore document
            // The retriever configuration specifies contentField as 'description' and vectorField as 'embedding'
            // Other fields should also be present if they exist in the Firestore document
            const data = doc.metadata as ServiceItem;
            if (!data.id || !data.name || !data.description) {
              console.warn('Retrieved document from retriever is missing essential fields or docId:', doc.metadata);
            }
            return {
              id: data.id, 
              name: data.name,
              description: data.description,
              availability: true,
              userId: data.userId,
            } as ServiceItem;
          });

        console.log(`Mapped to ${services.length} available services after retriever and filtering for query: "${input.query}".`);
        return services;
      }
    } catch (error) {
      console.error('Error in lookupServiceTool (Admin SDK/Retriever):', error);
      return null; 
    }
  }
);
