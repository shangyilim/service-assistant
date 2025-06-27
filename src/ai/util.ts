import { GenerateResponse, MessageData } from "genkit/beta";


export const agentDescription = (specialization: string, tools: string[]) => `
Transfer to this agent when the user asks about ${specialization}. 
This agent can perform the following functions: ${tools.map((t) => t).join(', ')}.
Do not mention that you are transferring, just do it.`;

// For debug use only - Process and display the chat response stream
export function handleChatResponse(
    response: GenerateResponse<any>,
    startMessageCount: number
  ) {
  
    // Extract and display tools used
    const toolsUsed = response.messages
      //.slice(startMessageCount)
      .filter((m: MessageData) => m.role === 'model')
      .flatMap((m: MessageData) =>
        m.content
          .filter((p) => !!p.toolRequest)
          .map(
            (p) =>
              `${p.toolRequest?.name}(${JSON.stringify(p.toolRequest?.input)})`
          )
      )
      .filter((t) => !!t);
  
    console.log('\nTools Used:', toolsUsed); // Simplified console log
  }