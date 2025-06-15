
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type DocumentReference } from "firebase/firestore";
import { generateEmbedding } from "@/ai/flows/generate-embedding-flow";
import type { ServiceItemFormValues } from "@/lib/schemas";
import type { ServiceItem } from "@/types";

export async function createOrUpdateServiceWithEmbedding(
  formValues: ServiceItemFormValues,
  userId: string,
  existingItemId?: string
): Promise<{ success: boolean; message: string; serviceId?: string }> {
  const servicesCollectionRef = collection(db, "services");
  let docRefToUpdate: DocumentReference | null = null;

  const baseData: Omit<ServiceItem, 'id' | 'embedding' | 'userId'> = {
    name: formValues.name,
    description: formValues.description,
    availability: formValues.availability,
  };

  try {
    if (existingItemId) {
      docRefToUpdate = doc(servicesCollectionRef, existingItemId);
      await updateDoc(docRefToUpdate, {
        ...baseData,
        // embedding will be reset and regenerated
      });
    } else {
      const newServiceData: Omit<ServiceItem, 'id' | 'embedding'> & { userId: string; embedding: null } = {
        ...baseData,
        userId: userId,
        embedding: null,
      };
      docRefToUpdate = await addDoc(servicesCollectionRef, newServiceData);
    }

    if (docRefToUpdate) {
      try {
        const embeddingInputText = `${formValues.name} ${formValues.description}`;
        const { embedding } = await generateEmbedding({ text: embeddingInputText });
        if (embedding) {
          await updateDoc(docRefToUpdate, { embedding: embedding });
          return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'} and embedding generated successfully.`, serviceId: docRefToUpdate.id };
        } else {
          // Log this issue, but the service itself was saved.
          console.warn(`Service ${existingItemId ? 'updated' : 'added'} (ID: ${docRefToUpdate.id}), but embedding generation returned no data.`);
          return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'} successfully, but embedding generation failed to return data.`, serviceId: docRefToUpdate.id };
        }
      } catch (embeddingError: any) {
        console.error(`Error generating or saving service embedding for service ID ${docRefToUpdate.id}: `, embeddingError);
        // Service was saved/updated, but embedding failed.
        return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'}, but failed to generate/save embedding: ${embeddingError.message}`, serviceId: docRefToUpdate.id };
      }
    }
    // This path should ideally not be reached if addDoc/doc succeeded.
    return { success: false, message: "Failed to obtain document reference for service operations." };

  } catch (error: any) {
    console.error("Error saving service document: ", error);
    return { success: false, message: `Could not save service: ${error.message}` };
  }
}
