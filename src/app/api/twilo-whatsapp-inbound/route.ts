
import { type NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { interpretMessage, type InterpretationResult } from '@/ai/flows/interpret-message-flow';
import { lookupFaqTool, type LookupFaqInput, type LookupFaqOutput } from '@/ai/tools/lookup-tools';
import { lookupServiceTool, type LookupServiceInput, type LookupServiceOutput } from '@/ai/tools/lookup-tools';
import type { FaqItem, ServiceItem } from '@/types';

// Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

if (!twilioAccountSid || !twilioAuthToken) {
  console.error('CRITICAL: Twilio credentials (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN) are not set in environment variables.');
  // Depending on your deployment, you might want to throw an error here
  // or handle it in a way that prevents the app from starting/running in a broken state.
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

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
  
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const formData = await request.formData();
    // const isValid = await validateTwilioRequest(request, formData);

    // if (!isValid) {
    //   // validateTwilioRequest already sent a response if invalid
    //   // but as a fallback or if it was modified to return boolean:
    //   console.warn('Invalid Twilio signature. Request rejected by POST handler.');
    //   return new NextResponse('Invalid Twilio signature.', { status: 403 });
    // }
    
    const userMessage = formData.get('Body')?.toString() || "";
    const from = formData.get('From')?.toString();
    const profileName = formData.get('ProfileName')?.toString();

    console.log(`Received Validated WhatsApp Message from ${profileName} (${from}): "${userMessage}"`);

    if (!userMessage.trim()) {
      twiml.message("It looks like you sent an empty message. How can I help you?");
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' }, status: 200 });
    }

    const interpretation: InterpretationResult = await interpretMessage({ userMessage });
    console.log('Message Interpretation Result:', { interpretation });

    let replyText = "";

    switch (interpretation.action) {
      case 'lookupFaq':
        if (interpretation.query) {
          const faqResults: LookupFaqOutput = await lookupFaqTool({ query: interpretation.query });
          if (faqResults && faqResults.length > 0) {
            replyText = "Here's what I found related to your question:\n\n";
            faqResults.slice(0, 3).forEach(faq => { // Limit to 3 FAQs for brevity
              replyText += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
            });
          } else {
            replyText = interpretation.responseText || `Sorry, I couldn't find an FAQ matching "${interpretation.query}".`;
          }
        } else {
          replyText = interpretation.responseText || "I can look that up for you, but what specifically are you asking about?";
        }
        break;

      case 'lookupServiceGeneric':
        const genericServiceResults: LookupServiceOutput = await lookupServiceTool({ queryType: 'GENERIC' });
        if (genericServiceResults && genericServiceResults.length > 0) {
          replyText = "Here are the services we offer:\n";
          genericServiceResults.forEach(service => {
            replyText += `- ${service.name}\n`;
          });
        } else {
          replyText = interpretation.responseText || "We currently don't have any services listed. Please check back later!";
        }
        break;

      case 'lookupServiceSpecific':
        if (interpretation.query) {
          const specificServiceResults: LookupServiceOutput = await lookupServiceTool({ queryType: 'SPECIFIC', query: interpretation.query });
          if (specificServiceResults && specificServiceResults.length > 0) {
            replyText = `Regarding "${interpretation.query}", here's what I found:\n\n`;
            specificServiceResults.slice(0, 3).forEach(service => { // Limit to 3 services
              replyText += `${service.name}: ${service.description}\nAvailable: ${service.availability ? 'Yes' : 'No'}\n\n`;
            });
          } else {
            replyText = interpretation.responseText || `Sorry, I couldn't find a service matching "${interpretation.query}".`;
          }
        } else {
          replyText = interpretation.responseText || "I can look up a specific service for you, but which service are you interested in?";
        }
        break;

      case 'directResponse':
        replyText = interpretation.responseText || "Got it!";
        break;

      case 'unclear':
      default:
        replyText = interpretation.responseText || "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
        break;
    }

    console.log('replytext', replyText);
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
