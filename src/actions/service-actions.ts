
'use server';

import { initializeApp, getApps, getApp as getAdminApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { generateEmbedding } from "@/ai/flows/generate-embedding-flow";
import type { ServiceItemFormValues } from "@/lib/schemas";
import type { ServiceItem } from "@/types";

// Initialize Firebase Admin SDK
let adminApp: App;
let adminDb: Firestore;

if (!getApps().length) {
  adminApp = initializeApp(); // Uses GOOGLE_APPLICATION_CREDENTIALS by default
} else {
  adminApp = getAdminApp();
}
adminDb = getFirestore(adminApp);

export async function createOrUpdateServiceWithEmbedding(
  formValues: ServiceItemFormValues,
  userId: string,
  existingItemId?: string
): Promise<{ success: boolean; message: string; serviceId?: string }> {
  const servicesCollectionRef = adminDb.collection("services");
  let docRefToUpdatePath: string | undefined;

  const baseData: Omit<ServiceItem, 'id' | 'embedding' | 'userId'> = {
    name: formValues.name,
    description: formValues.description,
    availability: formValues.availability,
  };

  try {
    let actualDocId: string;

    if (existingItemId) {
      const docRef = servicesCollectionRef.doc(existingItemId);
      await docRef.update({
        ...baseData,
        // embedding will be reset and regenerated
      });
      actualDocId = existingItemId;
      docRefToUpdatePath = docRef.path;
    } else {
      const newServiceData: Omit<ServiceItem, 'id' | 'embedding'> & { userId: string; embedding: null } = {
        ...baseData,
        userId: userId,
        embedding: null, // Initialize embedding as null
      };
      const newDocRef = await servicesCollectionRef.add(newServiceData);
      actualDocId = newDocRef.id;
      docRefToUpdatePath = newDocRef.path;
    }

    if (actualDocId) {
      try {
        const embeddingInputText = `${formValues.name} ${formValues.description}`;
        const { embedding } = await generateEmbedding({ text: embeddingInputText });

        if (embedding) {
          const finalDocRef = adminDb.doc(docRefToUpdatePath!); // Use the stored path
          await finalDocRef.update({ embedding: FieldValue.vector(embedding) });
          return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'} and embedding generated successfully.`, serviceId: actualDocId };
        } else {
          console.warn(`Service ${existingItemId ? 'updated' : 'added'} (ID: ${actualDocId}), but embedding generation returned no data.`);
          return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'} successfully, but embedding generation failed to return data.`, serviceId: actualDocId };
        }
      } catch (embeddingError: any) {
        console.error(`Error generating or saving service embedding for service ID ${actualDocId}: `, embeddingError);
        return { success: true, message: `Service ${existingItemId ? 'updated' : 'added'}, but failed to generate/save embedding: ${embeddingError.message}`, serviceId: actualDocId };
      }
    }
    // This path should ideally not be reached if operations were successful
    return { success: false, message: "Failed to obtain document reference for service operations." };

  } catch (error: any) {
    console.error("Error saving service document: ", error);
    return { success: false, message: `Could not save service: ${error.message}` };
  }
}
