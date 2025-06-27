import { z } from 'zod';
import { ai } from '@/ai/genkit';

import type { AgentSessionState } from '../types';
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../firebase-service';
import { AppointmentItem } from '@/types';
import { format } from 'date-fns';
import moment, { } from 'moment-timezone';


export const checkAppointmentAvailability = ai.defineTool(
  {
    name: 'checkAppointmentAvailability',
    description: 'checks to see if there is availability for an appointment.',
    inputSchema: z.object({
      service: z.string().describe('the service for the appointment'),
      date: z
        .string()
        .describe('date of the appointment in YYYY-MM-DD'),
      time: z.string().describe('time of the appointment in HH:mm'),
    }),
    outputSchema: z.object({
      available: z.boolean().describe('indicates whether the appointment is available or not'),
      appointmentId: z.string().optional().describe('the appointmentId that must be used by makeAppointment tool '),
    }),
  },
  async ({ service, date, time }) => {
    try {
      console.log('checkAppointmentAvailability', service, 'date', date, 'time', time, moment.tz.guess());

      const sessionState = ai.currentSession<AgentSessionState>().state;
      const timezone = sessionState?.businessInfo?.timezone;

      if (!timezone) {
        throw new Error('state is missing businessInfo.timezone');
      }

      const app = getFirebaseAdminApp();
      const firestore: Firestore = getFirestore(app);
      const appointmentsCollectionRef = firestore.collection('appointments');


      const localMoment = moment.tz(`${date} ${time}`, timezone);
      const localDate = localMoment.toDate();
      const startTime = Timestamp.fromDate(localDate);
      const endTime = Timestamp.fromDate(localMoment.clone().add(60, 'minute').toDate()); // Assume 60-minute appointments


      console.log('datetime', localMoment, 'startTime', startTime, 'endTime', endTime);
      const querySnapshot = await appointmentsCollectionRef
        .where('date', '==', Timestamp.fromDate(localDate))
        .where('startTime', '<', endTime)
        .where('endTime', '>', startTime)
        .get();

      if (!querySnapshot.empty) {
        console.log('not available');
        return { available: false, appointmentId: undefined }; // There is an overlapping appointment
      }

      const appointmentRef = appointmentsCollectionRef.doc();

      const appointment = {
        title: service,
        temporary: true,
        phoneNumber: sessionState?.phoneNumber,
        date: localDate,
        startTime: startTime,
        endTime: endTime,
        userId: sessionState?.userId,
      };

      await appointmentRef.create(appointment);

      return { available: true, appointmentId: appointmentRef.id }
    } catch (error) {
      return { available: false, error }
    }
  }
);


export const appointmentConfirmation = ai.defineTool(
  {
    name: 'appointmentConfirmation',
    description: ` 
    Creates an appointment for a customer. Do not call this tool if you dont have the appointmentId. You can get the appointmentId by first calling
    checkAppointmentAvailability tool
    `,
    inputSchema: z.object({
      appointmentId: z.string().describe('the id used to confirm an appointment'),
      service: z.string().describe('the service for the appointment'),
      date: z
        .string()
        .describe('date of the appointment in YYYY-MM-DD'),
      time: z.string().describe('time of the appointment in HH:mm'),
      confirmation: z.boolean().optional().describe('whether the customer confirms the appointment')
    }),

  },
  async ({ confirmation, appointmentId }) => {

    if(!confirmation || !appointmentId){
      return false;
    }
    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentRef = firestore.collection('appointments').doc(appointmentId);

    await appointmentRef.update({ temporary: false });

    return true;
  }
);



export const lookupAppointments = ai.defineTool(
  {
    name: 'lookupAppointments',
    description: 'look up a customers appointments',
    inputSchema: z.object({
      phoneNumber: z.string().optional() // no idea why this is needed by genkit or else it crashes
    })
  },
  async () => {

    const customerState = ai.currentSession<AgentSessionState>().state;

    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentsCollectionRef = firestore.collection('appointments');

    const appointmentsSnapshot = await appointmentsCollectionRef
      .where('userId', '==', customerState?.userId)
      .get();

    const appointments = appointmentsSnapshot.docs.map((doc) => {

      const data = doc.data();

      return {
        id: doc.id,
        service: data.title,
        date: (data.date as Timestamp).toDate(),
        time: `${format((data.startTime as Timestamp).toDate(), 'HH:mm')} - ${format((data.endTime as Timestamp).toDate(), 'HH:mm')}`,
      }
    });

    if (appointments.length === 0) {
      return { status: 'NO_APPOINTMENTS_FOUND' }
    }
    else {
      return { status: 'APPOINTMENTS_FOUND', appointments };
    }
  }
);

export const modifyAppointment = ai.defineTool(
  {
    name: 'modifyAppointment',
    description: 'modify or cancel an appointment',
    inputSchema: z.object({
      appointmentId: z.string().describe('existing appointment to modify or cancel'),
      action: z.enum(['MODIFY', 'CANCEL']).describe("if the customer wants to modify an appointment use MODIFY. If the intention is to cancel it use CANCEL"),
      date: z
        .string().optional()
        .describe('date of the appointment in YYYY-MM-DD'),
      time: z.string().optional().describe('time of the appointment in HH:mm'),
    }),
  },
  async ({ appointmentId, action, date, time }) => {

    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentsCollectionRef = firestore.collection('appointments');
    if (action === 'MODIFY') {
      const dateTime = new Date(`${date}T${time}`);
      const startTime = Timestamp.fromDate(dateTime);
      const endTime = Timestamp.fromDate(new Date(dateTime.getTime() + 60 * 60000)); // Assume 60-minute appointments
      await appointmentsCollectionRef.doc(appointmentId).update({
        date: new Date(`${date}`),
        startTime: startTime,
        endTime: endTime,
      });

      return { success: true }
    }
    else if (action === 'CANCEL') {
      await appointmentsCollectionRef.doc(appointmentId).delete();
      return { success: true }
    }

    return { success: false, message: 'Something went wrong' };

  }
);