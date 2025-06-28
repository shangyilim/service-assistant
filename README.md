# Multi Agent Business Service Assistant Chatbot

This is a Multi-Agent business service assistant WhatsApp chatbot project built with NextJS in Firebase Studio, and uses Twilio communicate with Whatsapp. [Checkout the medium article here](https://medium.com/@shangyilim/part-1-building-a-whatapp-chatbot-service-dashboard-with-firebase-studio-and-genkit-9929326b87e6)

The app has 2 main functionalities:

1. Business facing management web app
- To serve an admin dashboard so the business can manage data that the chatbot can retrieve
- Manage appointments that customers have made via the chatbot. 

2. WhatsApp Webhook Web API
- Exposes a Web API that hooks into a chatbot when a WhatsApp message is received to let the customer enquire about services and make service related appointments.


## AI Agents

This project utilizes a multi-agent architecture powered by the Genkit AI framework to handle customer interactions. The core of this system is the `routingAgent`.

### `src/ai/agents/routing-agent.ts`

The `routingAgent` acts as the primary point of contact for incoming customer inquiries. Its main function is to understand the user's intent and route their request to the appropriate specialized agent or tool.

**How it Works in a Multi-Agent Chatbot:**

1.  **Initial Contact:** When a user sends a message, it is first processed by the `routingAgent`.
2.  **Intent Recognition:** The `routingAgent` analyzes the user's message to determine the underlying intent. For example, is the user asking about services, trying to book an appointment, or something else?
3.  **Tool and Agent Selection:** Based on the recognized intent, the `routingAgent` decides which tool or specialized agent is best equipped to handle the request.
    *   If the user is asking a general question that can be answered by looking up service information, the `lookupServiceTool` might be used.
    *   If the user wants to book, modify, or cancel an appointment, the request is routed to the `appointmentAgent`.
    *   If the agent needs to gather customer information such as name, it can use the `customerInfoTool`.
    *   When the conversation is complete, the `endSessionTool` is used to close the session.
4.  **Delegation:** The `routingAgent` delegates the task to the selected tool or agent. In the case of another agent (like the `appointmentAgent`), the conversation context is likely passed along.
5.  **Response Handling:** The `routingAgent` receives the result or response from the tool or specialized agent and formats it for the user.

## Session Handling

The web API is stateless, so the chatbot doesnt recall the conversation that happeneed with the customer. Since this chatbot needs to serve multiple customers,we need a way where it can persist its context across different. customers
However, when integrating LLM chat into an application, you will usually deploy your content generation logic as stateless web API endpoints. For persistent chats to work under this setup, you will need to implement some kind of session storage that can persist state across invocations of your endpoints.

To maintain context across multiple messages from a user, the session data is stored and retrieved using Realtime database as a storage, and its sessionId is stored with the customer information in Cloud Firestore:

### `src/ai/rtdb-session-store.ts`

This file contains the `RtdbSessionStore` class, which implements Genkit's `SessionStore` interface and uses Firebase Realtime Database (RTDB) to store session data.

*   **`get(sessionId)`:** This method retrieves session data from the Realtime Database based on a unique `sessionId`. It looks for data under the path `sessions/${sessionId}`.
*   **`save(sessionId, sessionData)`:** This method saves the current `sessionData` for a given `sessionId` to the Realtime Database under the `sessions/${sessionId}` path.
*   **`delete(sessionId)`:** This method removes the session data for a given `sessionId` from the Realtime Database.

This RTDB-based session store allows the chatbot to remember previous turns in a conversation, maintain user-specific information (like the customer's name), and ensure that the AI agents have the necessary context to provide relevant responses.

### TL;DR; ###

Essentially, the `routingAgent` acts like a receptionist or dispatcher in the multi-agent system, ensuring that customer requests are directed to the correct "department" (specialized agent or tool) for efficient and accurate handling. This modular approach allows for the development of specialized agents that are experts in specific domains (like appointments) while keeping the initial routing logic centralized and manageable.


## Setup ##
You can easily start using by forking this, and import into Firebase Studio. Then follow the following changes:
1. Create a Firebase project and add a web project.
2. Modify `src/lib/firebase.ts` to include use your Firebase configuration.
3. Configure Google Sign in Provider via Firebase Authentication in the Firebase console. 
4. `npm install` and `npm run start` to start the app.
5. If you are using Firebase Studio, simply open the default port (should be 9000) as public. This lets you test the webhook integration directly with Twilio
4. Create a .env file and include your settings and keys:

```
# your gemini api key
GEMINI_API_KEY=
# twilio auth to send and receive messages
TWILIO_AUTH_TOKEN=
TWILIO_ACCOUNT_SID=
# used by the Genkit to do stuff
GOOGLE_APPLICATION_CREDENTIALS=
# realtime database url
FIREBASE_DATABASE_URL=
```

4. Have fun