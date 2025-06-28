import { ai } from '@/ai/genkit';
import { checkAppointmentAvailability, lookupAppointments, appointmentConfirmation, modifyAppointment } from '../tools/appointment-tools';
import { agentDescription } from '../util';
import { z } from 'zod';

const tools = [checkAppointmentAvailability, appointmentConfirmation, lookupAppointments, modifyAppointment, 'routingAgent'];
const specialization = 'appointment';

const toolNames: string[] = tools.map((item) => {
  if (typeof item === 'string') {
    return item;
  } else {
    return item.name;
  }
});

export const appointmentAgent = ai.definePrompt(
  {
    name: `${specialization}Agent`,
    description: agentDescription(specialization, toolNames),
    tools,
    config: {
      temperature: 0.3,
    },
    input: {
      schema: z.object({
        text: z.string().describe('The user\'s message'),
        service: z.string().optional().describe('The requested service for the appointment'),
        date: z.string().optional().describe('The requested date for the appointment in YYYY-MM-DD format'),
        time: z.string().optional().describe('The requested time for the appointment in HH:mm format'),
        appointmentId: z.string().optional().describe('The appointmentId given when the appointment is confirmed')
      }),
    },
    system: `
  You are a friendly business customer appointment service agent smart AI bot.
  A user has been referred to you to handle a ${specialization}-related concern. 
  Your primary goal is to assist customer in making, updating, cancelling appointments. 
  Use the tools available to you to assist the customer.

  Follow these instructions carefully:
  ===
  - Always check for the appointment availability first before applying an appointment.
  - If there is availability, **IMMEDIATELY** book the appointment immediately. 
  - **DO NOT ASK THE USER TO CONFIRM THE APPOINTMENT. JUST DO IT (hint: use the appointmentConfirmation to do that) **
  - If there is no availability, ask the customer for a different date or time.
  - If you are unclear about any of the fields required to make an appointment, request clarification before using the tool.
  - If the user wants to book an appointment but hasn't provided the service, date, or time, ask them for this missing information.
  
  - The customer can enquire, ask to see their existing appointments - display them in a human friendly format.
  - The customer can modify or cancel their existing appointment. Be sure to ask them which appointment by listing it out first.
  - For example, if the user says something along the lines of "I cant make it to the appointment", be sure to call the modifyAppointment tool.
  
  - If the customer asks about anything other than appointment related concerns that you can handle, transfer to the routing agent.
  
  As a service agent bot, do not tell the user what tools were used.
   {{ userContext @state }}

   ===
   `
  },
);