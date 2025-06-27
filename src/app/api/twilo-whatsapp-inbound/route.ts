
import { type NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';


import { getFirestore } from "firebase-admin/firestore";

import { ai } from '@/ai/genkit';
import { RtdbSessionStore } from '@/ai/rtdb-session-store';
import { routingAgent } from '@/ai/agents/routing-agent';
import { getFirebaseAdminApp } from '@/ai/firebase-service';
import { AgentSessionState } from '@/ai/types';
import { GenerateResponse, Message, MessageData, ToolRequestPart } from 'genkit/beta';
import { BusinessInfo, FirestoreCustomer } from '../types';
import { getDatabase } from 'firebase-admin/database';
import { handleChatResponse } from '@/ai/util';

// Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

if (!twilioAccountSid || !twilioAuthToken) {
  console.error('CRITICAL: Twilio credentials (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN) are not set in environment variables.');
  // Depending on your deployment, you might want to throw an error here
  // or handle it in a way that prevents the app from starting/running in a broken state.
}


/**
 * Handles POST requests for inbound Twilio WhatsApp messages.
 * @param request - The NextRequest object.
 * @returns A NextResponse object.
 */
export async function POST(request: NextRequest) {
  if (!twilioAccountSid || !twilioAuthToken) {
    console.error('Twilio route called, but Twilio credentials are not configured. Aborting.');
    return NextResponse.json({ error: 'Service configuration error.' }, { status: 500 });
  }

  // TO-DO: validate the incoming twilo message
  
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const formData = await request.formData();

    const userMessage = formData.get('Body')?.toString() || "";
    const from = formData.get('From')?.toString();
    const profileName = formData.get('ProfileName')?.toString();

    console.log(`Received WhatsApp Message from ${profileName} (${from}): "${userMessage}"`);

    if (!userMessage.trim()) {
      twiml.message("It looks like you sent an empty message. How can I help you?");
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' }, status: 200 });
    }

    if (!from) {
      throw new Error('from is missing');
    }

    const { session, clearSession } = await getSession(from);


    const chat = session.chat(routingAgent)

    const response = await chat.send(userMessage);


    const startMessageCount = chat.messages.length;
    handleChatResponse(response, startMessageCount);
    let replyText = response.text;

    console.log('replytext', replyText);
    /*
    TO-DO: something went wrong with no response. let's clear the session for now to reset the 
    conversation, and inform the user.
    */
    if (!replyText) {
      console.log("response", JSON.stringify(response));
      await clearSession();
      replyText = "Sorry, I was unable to book your appointment. Please try again or call us directly."
    }

    twiml.message(replyText.trim());
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    let errorMessage = 'Failed to process webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error processing Twilio webhook:', errorMessage, error);

    // Send a generic error message via TwiML if possible
    try {
      twiml.message('Sorry, something went wrong on our end. Please try again later.');
      return new NextResponse(twiml.toString(), {
        status: 200, // Twilio expects 200 for TwiML, even on app error
        headers: { 'Content-Type': 'text/xml' }
      });
    } catch (twimlError) {
      console.error('Error generating TwiML error response:', twimlError);
      // Fallback to JSON error if TwiML itself fails
      return NextResponse.json({ error: 'Internal server error during webhook processing and TwiML generation.' }, { status: 500 });
    }
  }
}

/**
 * Handles GET requests, often used for endpoint verification by webhook providers.
 * @param request - The NextRequest object.
 * @returns A NextResponse object.
 */
export async function GET(request: NextRequest) {
  const queryParams = request.nextUrl.searchParams;
  console.log('Twilio WhatsApp Inbound GET Request Parameters:', queryParams.toString());
  return NextResponse.json({ message: 'Endpoint active. Ready for POST requests.' }, { status: 200 });
}

async function validateTwilioRequest(request: NextRequest, formData: FormData): Promise<boolean> {
  const localTwilioAuthToken = process.env.TWILIO_AUTH_TOKEN; // Use the one defined at the top of the file for consistency

  if (!localTwilioAuthToken) {
    // This was already checked, but for safety within this function's scope
    console.error('CRITICAL: TWILIO_AUTH_TOKEN is not set. Validation cannot proceed.');
    // For security, do not inform the client about specific configuration issues.
    return false;
  }

  const twilioSignature = request.headers.get('X-Twilio-Signature');
  if (!twilioSignature) {
    console.warn('Request received without X-Twilio-Signature header. Invalid.');
    return false;
  }

  const requestUrl = request.url;
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }

  const isValid = twilio.validateRequest(
    localTwilioAuthToken,
    twilioSignature,
    requestUrl,
    params
  );

  if (!isValid) {
    console.warn('Invalid Twilio signature. Request will be rejected.');
  } else {
    console.log('Twilio request signature validated successfully.');
  }
  return isValid;
}

async function getUserSessionInfo(from: string) {

  const db = getFirestore(getFirebaseAdminApp());

  const customerRef = db.collection('customers').doc(from);
  const customerDoc = await customerRef.get();
  const existingCustomer =  customerDoc.data();

  const existingSessionIdExists =  !!existingCustomer?.sessionId;

  console.log('existingCustomer.sessionId', existingCustomer?.sessionId);

  const newSessionId = crypto.randomUUID();

  const updatedCustomer = {
    sessionId: existingCustomer?.sessionId ?? newSessionId,
    phoneNumber: existingCustomer?.phoneNumber ?? from.replace('whatsapp:', ""),
    name: existingCustomer?.name ??'',
  }

  await customerRef.set(updatedCustomer, {merge: true});

  return {
    sessionId: updatedCustomer.sessionId,
    exist: existingSessionIdExists,
    customer: updatedCustomer,
  }

}



async function getSession(from: string) {


  const businessInfo = await getBusinessInfo();
  const { sessionId, exist, customer } = await getUserSessionInfo(from);

  console.log('sessionId', sessionId, 'exist', exist, 'user', customer);

  const sessionStore = new RtdbSessionStore();
  let session;

  if (exist) {
    session = await ai.loadSession(sessionId, {
      store: sessionStore,
    });
  }
  else {
    console.log('session not found, creating new');
    session = ai.createSession<AgentSessionState>({
      sessionId: sessionId,
      store: sessionStore,
      initialState: {
        userId: from,
        phoneNumber: customer.phoneNumber,
        name: customer.name,
        businessInfo,
      }
    })
  }
  return {
    session,
    clearSession: () =>
      sessionStore.delete(sessionId)
  };
}

async function getBusinessInfo() {
  const adminApp = getFirebaseAdminApp();
  const rtdb = getDatabase(adminApp);
  const businessRef = rtdb.ref('businessInfo');
  const snapshot = await businessRef.once('value');
  return snapshot.val() as BusinessInfo;
}
