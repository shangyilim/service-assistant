/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ai} from '@/ai/genkit';
import { appointmentAgent } from './appointmentAgent';
import { searchEvents, upcomingHolidays } from './tools';
import { lookupServiceTool } from '../tools/lookup-tools';


export const routingAgent = ai.definePrompt(
  {
    name: 'routingAgent',
    description: `This agent helps with answering inquiries and requests.`,
    tools: [lookupServiceTool, appointmentAgent],
  },
  `You are a friendly business customer service agent.
  
  Your job is to help answer inquiries from customers. Customers may ask you business service related questions,
  or book an appointment 

  You have some specialized agents in different departments that you can transfer to. 

  1. Appointment Agent - This agent can help with appointment requests, such as creating, modifying or cancelling an appointment.

  Use the information below and any tools made available to you to respond to the customer's requests.
  
  If the customer has an inquiry that you do not know the answer to, do NOT make the answer up. Simply let them know that you cannot help them,
  and direct them to call the business directly where a human will be able to help them.

`
);
