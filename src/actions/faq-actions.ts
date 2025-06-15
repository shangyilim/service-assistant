
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, type DocumentReference } from "firebase/firestore";
import { generateEmbedding } from "@/ai/flows/generate-embedding-flow";
import type { FaqItemFormValues } from "@/lib/schemas";
import type { FaqItem } from "@/types";

export async function createOrUpdateFaqWithEmbedding(
  formValues: FaqItemFormValues,
  userId: string,
  existingItemId?: string
): Promise<{ success: boolean; message: string; faqId?: string }> {
  const faqsCollectionRef = collection(db, "faqs");
  let docRefToUpdate: DocumentReference | null = null;

  const baseData: Omit<FaqItem, 'id' | 'embedding' | 'userId'> = {
    question: formValues.question,
    answer: formValues.answer,
  };

  try {
    if (existingItemId) {
      docRefToUpdate = doc(faqsCollectionRef, existingItemId);
      await updateDoc(docRefToUpdate, {
        ...baseData,
        // embedding will be reset and regenerated
      });
    } else {
      const newFaqData: Omit<FaqItem, 'id' | 'embedding'> & { userId: string; embedding: null } = {
        ...baseData,
        userId: userId,
        embedding: null,
      };
      docRefToUpdate = await addDoc(faqsCollectionRef, newFaqData);
    }

    if (docRefToUpdate) {
      try {
        const embeddingInputText = `${formValues.question} ${formValues.answer}`;
        const { embedding } = await generateEmbedding({ text: embeddingInputText });
        if (embedding) {
          await updateDoc(docRefToUpdate, { embedding: embedding });
          return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'} and embedding generated successfully.`, faqId: docRefToUpdate.id };
        } else {
           console.warn(`FAQ ${existingItemId ? 'updated' : 'added'} (ID: ${docRefToUpdate.id}), but embedding generation returned no data.`);
          return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'} successfully, but embedding generation failed to return data.`, faqId: docRefToUpdate.id };
        }
      } catch (embeddingError: any) {
        console.error(`Error generating or saving FAQ embedding for FAQ ID ${docRefToUpdate.id}: `, embeddingError);
        return { success: true, message: `FAQ ${existingItemId ? 'updated' : 'added'}, but failed to generate/save embedding: ${embeddingError.message}`, faqId: docRefToUpdate.id };
      }
    }
    return { success: false, message: "Failed to obtain document reference for FAQ operations." };

  } catch (error: any) {
    console.error("Error saving FAQ document: ", error);
    return { success: false, message: `Could not save FAQ: ${error.message}` };
  }
}
