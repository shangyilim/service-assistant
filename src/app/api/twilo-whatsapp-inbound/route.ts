
import { type NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

/**
 * Handles POST requests for inbound Twilio WhatsApp messages.
 * @param request - The NextRequest object.
 * @returns A NextResponse object.
 */
export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('CRITICAL: TWILIO_AUTH_TOKEN is not set in environment variables.');
    // Do not expose detailed error to client for security reasons
    return NextResponse.json({ error: 'Webhook configuration error.' }, { status: 500 });
  }

  const twilioSignature = request.headers.get('X-Twilio-Signature');
  if (!twilioSignature) {
    console.warn('Request received without X-Twilio-Signature header.');
    return NextResponse.json({ error: 'Missing Twilio signature.' }, { status: 400 });
  }

  // The URL used for validation must be the full URL Twilio POSTed to, including query params.
  // request.url from NextRequest provides this.
  const requestUrl = request.url;

  try {
    // Parse formData to get parameters for validation and for use.
    // This needs to be done before accessing specific fields like 'Body'.
    const formData = await request.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      // Twilio sends form data as strings. If files were involved, this would need more handling.
      if (typeof value === 'string') {
        params[key] = value;
      }
    }
    
    const isValid = twilio.validateRequest(
      authToken,
      twilioSignature,
      requestUrl,
      params // These are the POST parameters from the form data
    );

    if (!isValid) {
      console.warn('Invalid Twilio signature. Request rejected.');
      return NextResponse.json({ error: 'Invalid Twilio signature.' }, { status: 403 });
    }

    // If execution reaches here, the request is validated.
    // Now, safely access the form data.
    const body = formData.get('Body');
    const from = formData.get('From');
    const to = formData.get('To');
    const messageSid = formData.get('MessageSid');
    const numMedia = formData.get('NumMedia');
    const profileName = formData.get('ProfileName'); // Sender's WhatsApp profile name

    // Log the raw form data (params) for debugging if needed (now that it's validated)
    console.log('Twilio WhatsApp Inbound POST Request (Validated) Raw Params:', params);

    // Log extracted message details
    console.log('Received Validated WhatsApp Message:');
    console.log(`  SID: ${messageSid}`);
    console.log(`  From: ${from} (Profile: ${profileName || 'N/A'})`);
    console.log(`  To: ${to}`);
    console.log(`  Body: ${body}`);
    console.log(`  Number of Media: ${numMedia}`);

    // TODO: Add your logic here to process the Twilio webhook.
    // For example, parse the message content, interact with your database,
    // or trigger other services.

    // Respond to Twilio to acknowledge receipt.
    // For message webhooks, Twilio often expects an empty 200 OK,
    // or a TwiML response if you intend to send an automated reply.
    // For an empty 200 OK:
    // return new NextResponse(null, { status: 200 });
    
    // Example of sending a TwiML reply (requires twilio package):
    // const twiml = new twilio.twiml.MessagingResponse();
    // twiml.message('Thanks for your message!');
    // return new NextResponse(twiml.toString(), { 
    //   status: 200, 
    //   headers: { 'Content-Type': 'text/xml' } 
    // });

    return NextResponse.json({ message: 'Webhook received and validated successfully' }, { status: 200 });

  } catch (error) {
    let errorMessage = 'Failed to process webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error processing Twilio webhook:', errorMessage);
    // Avoid exposing internal error details unless intended for debugging.
    return NextResponse.json({ error: 'Internal server error during webhook processing.' }, { status: 500 });
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
