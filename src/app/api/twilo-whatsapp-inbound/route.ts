
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests for inbound Twilio WhatsApp messages.
 * @param request - The NextRequest object.
 * @returns A NextResponse object.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Twilio WhatsApp Inbound POST Request Body:', body);

    // TODO: Add your logic here to process the Twilio webhook.
    // For example, validate the Twilio signature, parse the message content,
    // interact with your database, or trigger other services.

    // Respond to Twilio to acknowledge receipt.
    // For message webhooks, Twilio often expects an empty 200 OK,
    // or a TwiML response if you intend to send an automated reply.
    // Sending a simple JSON acknowledgement is also acceptable for initial setup.
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });
  } catch (error) {
    let errorMessage = 'Failed to process webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error processing Twilio webhook:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Handles GET requests, often used for endpoint verification by webhook providers.
 * @param request - The NextRequest object.
 * @returns A NextResponse object.
 */
export async function GET(request: NextRequest) {
  // Webhook providers like Twilio might send a GET request for endpoint verification.
  // You might need to handle specific query parameters (e.g., 'hub.challenge' for some platforms).
  const queryParams = request.nextUrl.searchParams;
  console.log('Twilio WhatsApp Inbound GET Request Parameters:', queryParams.toString());

  // TODO: Add any specific verification logic required by Twilio if applicable.

  return NextResponse.json({ message: 'Endpoint active. Ready for POST requests.' }, { status: 200 });
}
