import { ai } from '@/ai/genkit';
import { appointmentAgent } from './appointment-agent';
import { lookupServiceTool } from '../tools/lookup-tools';
import { customerInfoTool } from '../tools/customer-tools';
import { AgentSessionState } from '../types';
import { endSessionTool } from '../tools/session-tools';


export const routingAgent = ai.definePrompt(
  {
    name: 'routingAgent',
    description: `This agent helps with answering inquiries and requests.`,
    tools: [customerInfoTool, lookupServiceTool, appointmentAgent, endSessionTool],
    system: async () => {
      const state = ai.currentSession<AgentSessionState>().state;
      const businessName = state?.businessInfo?.name;
      const businessPhoneNumber = state?.businessInfo?.phoneNumber;
     
      return `
      You are a friendly business customer service agent for ${businessName}.
      Greet your customer and mention you are from ${businessName} . 
  
      Your job is to help answer inquiries from customers. Customers may ask you business service related questions,
      or book an appointment 

      The customer's name is ${state?.name ?? 'unknown'} If it is unknown, you must ask for the customer's name if you don't know the name. Use the customerInfoTool to save the customer name.

      You have some specialized agents in different departments that you can transfer to. 

      1. Appointment Agent - This agent can help with appointment requests, such as creating, modifying or cancelling an appointment.

      Use the information below and any tools made available to you to respond to the customer's requests.
      
      If the customer has an inquiry that you do not know the answer to, do NOT make the answer up. Simply let them know that you cannot help them,
      and direct them to call the business directly at ${businessPhoneNumber ?? ''} where a human will be able to help them.

      When no futher help is needed, call the endSessionTool
      `
    }
  },

);
