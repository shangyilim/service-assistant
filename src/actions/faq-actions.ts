
'use server';


import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { generateEmbedding } from "@/ai/flows/generate-embedding-flow";
import type { FaqItemFormValues } from "@/lib/schemas";
import type { FaqItem } from "@/types";
import { getFirebaseAdminApp } from '@/ai/firebase-service';


export async function createOrUpdateFaqWithEmbedding(
  formValues: FaqItemFormValues,
  userId: string,
  existingItemId?: string
): Promise<{ success: boolean; message: string; faqId?: string }> {
  const adminApp = getFirebaseAdminApp();
  const adminDb = getFirestore(adminApp);

  const faqsCollectionRef = adminDb.collection("faqs");
  let docRefToUpdatePath: string | undefined;

  const baseData: Omit<FaqItem, 'id' | 'embedding' | 'userId'> = {
    question: formValues.question,
    answer: formValues.answer,
  };

  try {
    let actualDocId: string;

    if (existingItemId) {
      const docRef = faqsCollectionRef.doc(existingItemId);
      await docRef.update({
        ...baseData,
        // embedding will be reset and regenerated
      });
      actualDocId = existingItemId;
      docRefToUpdatePath = docRef.path;
    } else {
      const newFaqData: Omit<FaqItem, 'id' | 'embedding'> & { userId: string; embedding: null } = {
        ...baseData,
        userId: userId,
        embedding: null, // Initialize embedding as null
      };
      const newDocRef = await faqsCollectionRef.add(newFaqData);
      actualDocId = newDocRef.id;
      docRefToUpdatePath = newDocRef.path;
    }

    if (actualDocId) {
      try {
        const embeddingInputText = `${formValues.question} ${formValues.answer}`;
        const { embedding } = await generateEmbedding({ text: embeddingInputText });
        
        if (embedding) {
          const finalDocRef = adminDb.doc(docRefToUpdatePath!); // Use the stored path
          await finalDocRef.update({ embedding: FieldValue.vector(embedding) });
          return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'} and embedding generated successfully.`, faqId: actualDocId };
        } else {
           console.warn(`FAQ ${existingItemId ? 'updated' : 'added'} (ID: ${actualDocId}), but embedding generation returned no data.`);
          return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'} successfully, but embedding generation failed to return data.`, faqId: actualDocId };
        }
      } catch (embeddingError: any) {
        console.error(`Error generating or saving FAQ embedding for FAQ ID ${actualDocId}: `, embeddingError);
        return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'}, but failed to generate/save embedding: ${embeddingError.message}`, faqId: actualDocId };
      }
    }
    // This path should ideally not be reached if operations were successful
    return { success: false, message: "Failed to obtain document reference for FAQ operations." };

  } catch (error: any) {
    console.error("Error saving FAQ document: ", error);
    return { success: false, message: `Could not save FAQ: ${error.message}` };
  }
}
