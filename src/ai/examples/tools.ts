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

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { EXAMPLE_EVENTS, EXAMPLE_GRADES, getUpcomingHolidays } from './data';

import type { AgentState } from './types';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../firebase-service';
import { AppointmentItem } from '@/types';


export const searchEvents = ai.defineTool(
  {
    name: 'searchEvents',
    description:
      'use this when asked about any time/location for school events including extra curriculars like clubs',
    inputSchema: z.object({
      activity: z
        .string()
        .optional()
        .describe(
          'if looking for a particular activity, provide it here. must be an exact match for an activity name'
        ),
      grade: z
        .number()
        .optional()
        .describe('restrict searched events to a particular grade level'),
    }),
  },
  async ({ activity, grade }) => {
    return EXAMPLE_EVENTS.filter(
      (e) => !grade || e.grades.includes(grade)
    ).filter(
      (e) => !activity || e.activity?.toLowerCase() === activity?.toLowerCase()
    );
  }
);



export const reportAbsence = ai.defineTool(
  {
    name: 'reportAbsence',
    description:
      'use this tool to mark a specific student as absent on one or more days',
    inputSchema: z.object({
      name: z.number().describe('the name of the student'),
      date: z.string().describe('the date of the absence in YYYY-MM-DD format'),
      reason: z.string().describe('the provided reason for the absence'),
      excused: z
        .boolean()
        .describe('whether the absence is excused by the parent'),
    }),
  },
  async (input) => {
    const student = ai.currentSession<AgentState>().state!
    
    console.log(
      `[TOOL] Absence reported for ${student.userId} (ID: ${input.name}) on ${input.date}`
    );
    return { ok: true, message: 'Absence successfully recorded' };
  }
);

export const reportTardy = ai.defineTool(
  {
    name: 'reportTardy',
    description:
      'use this tool to mark a specific student tardy for a given date',
    inputSchema: z.object({
      studentId: z.number().describe('the id of the student'),
      date: z.string().describe('the date of the tardy'),
      reason: z.string().describe('the provided reason reason for the tardy'),
      eta: z
        .string()
        .describe(
          'the time the student is expected to arrive at school in HH:MMam/pm format'
        ),
      excused: z
        .boolean()
        .describe('whether the absense is excused by the parent'),
    }),
  },
  async (input) => {
    // checkIsParent(input.studentId, ai.currentSession<AgentState>().state!);
    console.log(
      '[TOOL] Student',
      input.studentId,
      'has been reported tardy for',
      input.date
    );
    return { ok: true };
  }
);

export const upcomingHolidays = ai.defineTool(
  {
    name: 'upcomingHolidays',
    description: 'can retrieve information about upcoming holidays',
    outputSchema: z.string(),
  },
  async () => JSON.stringify(await getUpcomingHolidays())
);



export const checkAppointmentAvailability = ai.defineTool(
  {
    name: 'checkAppointmentAvailability',
    description: 'checks to see if there is availability for an appointment.',
    inputSchema: z.object({
      service: z.string().optional().describe('the service for the appointment'),
      date: z
        .string().optional()
        .describe('date of the appointment in YYYY-MM-DD'),
      time: z.string().optional().describe('time of the appointment in HH:mm'),
    }),
  },
  async ({ service, date, time }) => {

    console.log('service', service, 'date', date, 'time', time);
    
    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentsCollectionRef = firestore.collection('appointments');

    const dateTime = new Date(`${date}T${time}`);
    const startTime = Timestamp.fromDate(dateTime);
    const endTime = Timestamp.fromDate(new Date(dateTime.getTime() + 60 * 60000)); // Assume 60-minute appointments

    const querySnapshot = await appointmentsCollectionRef
      .where('date', '==', Timestamp.fromDate(new Date(`${date}`)))
      .where('startTime', '<', endTime)
      .where('endTime', '>', startTime)
      .get();

    if (!querySnapshot.empty) {
      return {available: false}; // There is an overlapping appointment
    }

    const customerState = ai.currentSession<AgentState>().state;
    const appointmentRef = appointmentsCollectionRef.doc();

    const appointment = {
      title: service,
      temporary: true,
      phoneNumber: customerState?.phoneNumber,
      date: new Date(`${date}`),
      startTime: startTime,
      endTime: endTime,
      userId: customerState?.userId,
    };

    await appointmentRef.create(appointment);

    return {available: true, appointmentId: appointmentRef.id}
  }
);


export const makeAppointment = ai.defineTool(
  {
    name: 'makeAppointment',
    description: 'Ensure that checkAppointment is called first for the selected date and time. creates an appointment for a customer. Do not call this tool if you determine all the inputs needed to create an appointment.',
    inputSchema: z.object({
      appointmentId: z.string().describe('result of whether the booking is available via the checkAppointmentAvailability tool'),
      customerName: z.string().optional().describe('customer name'),
      service: z.string().optional().describe('the service for the appointment'),
      date: z
        .string().optional()
        .describe('date of the appointment in YYYY-MM-DD, or as relative time such as tomorrow, next wednesday, day after tomorrow, following friday and resolve this into YYYY-MM-DD based on today date'),
      time: z.string().optional().describe('time of the appointment in HH:mm'),
    }),
  },
  async ({ appointmentId }) => {

    console.log('appointment id', appointmentId);
    
    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentRef = firestore.collection('appointments').doc(appointmentId);

    await appointmentRef.update({ temporary: false });


    return true;
  }
);
