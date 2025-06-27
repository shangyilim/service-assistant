import { SessionData, SessionStore } from "genkit/beta";
import { getApp as getAdminApp } from 'firebase-admin/app';
import { getDatabase } from "firebase-admin/database";
import { getFirebaseAdminApp } from "./firebase-service";

export class RtdbSessionStore<S = any> implements SessionStore<S> {
  async get(sessionId: string): Promise<SessionData<S> | undefined> {

 
      console.log('getting session data for ', sessionId);

      const adminApp = getFirebaseAdminApp();
      const rtdb = getDatabase(adminApp);
      
      const data = (await rtdb.ref(`sessions/${sessionId}`).get()).val(); 
      console.log('session exist?', data ? 'yes':'no');
      return data;
    
  }

  async save(sessionId: string, sessionData: SessionData<S>): Promise<void> {
   
    console.log('saving session for', sessionId, sessionData);
    const adminApp = getFirebaseAdminApp();
    const rtdb = getDatabase(adminApp);
    
    await rtdb.ref(`sessions/${sessionId}`).set(sessionData);
  }

  async delete(sessionId: string): Promise<void> {
    const adminApp = getFirebaseAdminApp();
    const rtdb = getDatabase(adminApp);
    
    await rtdb.ref(`sessions/${sessionId}`).remove();

  }
}