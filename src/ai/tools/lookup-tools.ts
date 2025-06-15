
/**
 * @fileOverview Defines Genkit tools for looking up FAQs and Services.
 *
 * - lookupFaqTool: A tool to search FAQs in Firestore.
 * - lookupServiceTool: A tool to search Services in Firestore, using vector search for specific queries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase'; // Firestore client for web
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import type { FaqItem, ServiceItem } from '@/types';
import { serviceRetriever } from '../retrievers/service-retriever'; // Import the Genkit retriever

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
      const faqsCollectionRef = collection(db, 'faqs');
      const q = query(faqsCollectionRef, orderBy('question')); 
      const querySnapshot = await getDocs(q);
      const faqs = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FaqItem))
        .filter(faq => faq.question.toLowerCase().includes(input.query.toLowerCase()) || faq.answer.toLowerCase().includes(input.query.toLowerCase()))
        .slice(0, 5); 

      console.log(`Found ${faqs.length} FAQs for query: "${input.query}"`);
      return faqs;
    } catch (error) {
      console.error('Error in lookupFaqTool:', error);
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
    const servicesCollectionRef = collection(db, 'services');

    try {
      if (input.queryType === 'GENERIC') {
        console.log('Performing GENERIC lookup for all available services.');
        const q = query(servicesCollectionRef, where('availability', '==', true), orderBy('name'));
        const querySnapshot = await getDocs(q);
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
        console.log(`Found ${services.length} generic services.`);
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
          // k: 5, // You can specify the number of documents to retrieve, e.g., top 5. Genkit might have a default.
        });
        
        console.log(`Retrieved ${retrievedDocs.length} documents via serviceRetriever.`);

        const services = retrievedDocs
          .map(doc => {
            const data = doc.metadata as Omit<ServiceItem, 'id'> & { docId?: string }; 
            if (!doc.metadata?.docId || !data.name || !data.description || typeof data.availability === 'undefined') {
              console.warn('Retrieved document from retriever is missing essential fields or docId:', doc.metadata);
              return null;
            }
            return {
              id: doc.metadata.docId, 
              name: data.name,
              description: data.description,
              availability: data.availability,
              userId: data.userId,
            } as ServiceItem;
          })
          .filter(service => service && service.availability) as ServiceItem[]; 

        console.log(`Mapped to ${services.length} available services after retriever and filtering.`);
        return services;
      }
    } catch (error) {
      console.error('Error in lookupServiceTool:', error);
      return null; 
    }
  }
);
