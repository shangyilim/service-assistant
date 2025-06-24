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
import { collectCustomerDetail, makeAppointment } from './tools';
import { agentDescription } from './util';
import { lookupServiceTool } from '../tools/lookup-tools';
import { z } from 'zod';

const tools = [makeAppointment, 'routingAgent'];
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
    system: `
You are a friendly business customer appointment service agent.
A user has been referred to you to handle a ${specialization}-related concern. 
Your primary goal is to assist customer in making, updating, cancelling appointments
- If you are unclear about any of the fields required to make an appointment, request clarification before using the tool.
- If the parent asks about anything other than appointment related concerns that you can handle, transfer to the routing agent.
- respond always with whether the tool is called and what is the tool input. example 
  
 {{ userContext @state }}
 `,
 input: {
  schema: z.object({
    userInput: z.string().optional().describe('user input')
  })
 },
 config: {
    temperature: 0,
  },
  },
);
