import { z } from 'zod';
import { ai } from '@/ai/genkit';

import type { AgentSessionState } from '../types';
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '../firebase-service';
import { AppointmentItem } from '@/types';
import { format } from 'date-fns';
import moment, { } from 'moment-timezone';


// Define the Genkit tool for checking appointment availability.
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

      // Get the current session state to access business information.
      const sessionState = ai.currentSession<AgentSessionState>().state;
      const timezone = sessionState?.businessInfo?.timezone;

      // Ensure timezone information is available.
      if (!timezone) {
        throw new Error('state is missing businessInfo.timezone');
      }

      // Initialize Firebase Admin and Firestore.
      const app = getFirebaseAdminApp();
      const firestore: Firestore = getFirestore(app);
      const appointmentsCollectionRef = firestore.collection('appointments');

      // Convert the provided date and time to a moment object in the business's timezone.
      const localMoment = moment.tz(`${date} ${time}`, timezone);
      const localDate = localMoment.toDate();

      // Calculate the start and end times for the appointment.
      const startTime = Timestamp.fromDate(localDate);
      const endTime = Timestamp.fromDate(localMoment.clone().add(60, 'minute').toDate()); // Assume 60-minute appointments

      console.log('datetime', localMoment, 'startTime', startTime, 'endTime', endTime);

      // Query Firestore to check for overlapping appointments.
      const querySnapshot = await appointmentsCollectionRef
        .where('date', '==', Timestamp.fromDate(localDate))
        .where('startTime', '<', endTime)
        .where('endTime', '>', startTime)
        .get();

      // If there are overlapping appointments, the slot is not available.
      if (!querySnapshot.empty) {
        console.log('not available');
        return { available: false, appointmentId: undefined }; // There is an overlapping appointment
      }

      // If the slot is available, create a temporary appointment entry.
      const appointmentRef = appointmentsCollectionRef.doc();

      const appointment = {
        title: service,
        // Mark the appointment as temporary until confirmed by the user.
        temporary: true,
        phoneNumber: sessionState?.phoneNumber,
        date: localDate,
        startTime: startTime,
        endTime: endTime,
        userId: sessionState?.userId,
        name: sessionState?.name,
        bookedBy: 'chatbot',
      };

      // Create the temporary appointment document in Firestore.
      await appointmentRef.create(appointment);

      // Return availability status and the ID of the temporary appointment.
      return { available: true, appointmentId: appointmentRef.id }
      // Catch any errors during the process.
    } catch (error) {
      return { available: false, error }
    }
  }
);


// Define the Genkit tool for confirming an appointment.
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

    // Check if confirmation is true and appointmentId is provided.
    if (!confirmation || !appointmentId) {
      return false;
    }
    // Initialize Firebase Admin and Firestore.
    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    // Get the reference to the appointment document.
    const appointmentRef = firestore.collection('appointments').doc(appointmentId);

    // Update the appointment to mark it as not temporary (confirmed).
    await appointmentRef.update({ temporary: false });
    // Return true to indicate successful confirmation.

    return true;
  }
);



// Define the Genkit tool for looking up a customer's appointments.
export const lookupAppointments = ai.defineTool(
  {
    name: 'lookupAppointments',
    description: 'list, retrieve all appointments of a customer',
    // The phoneNumber field seems to be required by Genkit internally, even if not used directly.
    inputSchema: z.object({
      userInput: z.string().optional().describe('the user id which can be gotten from the state') // no idea why this is needed by genkit or else it crashes
    })
  },
  // The asynchronous function that executes the tool's logic.
  async () => {

    const customerState = ai.currentSession<AgentSessionState>().state;

    const app = getFirebaseAdminApp();
    const firestore: Firestore = getFirestore(app);
    const appointmentsCollectionRef = firestore.collection('appointments');

    const appointmentsSnapshot = await appointmentsCollectionRef
      // Query for appointments associated with the current user.
      .where('userId', '==', customerState?.userId)
      .get();

    // Map the Firestore document snapshots to a more usable format.
    const appointments = appointmentsSnapshot.docs.map((doc) => {

      const data = doc.data();
      // Format the date and time for display.

      return {
        id: doc.id,
        service: data.title,
        date: (data.date as Timestamp).toDate(),
        time: `${format((data.startTime as Timestamp).toDate(), 'HH:mm')} - ${format((data.endTime as Timestamp).toDate(), 'HH:mm')}`,
      }
    });

    // Return status and appointment data based on whether appointments were found.
    if (appointments.length === 0) {
      return { status: 'NO_APPOINTMENTS_FOUND' }
    }
    else {
      return { status: 'APPOINTMENTS_FOUND', appointments };
    }
  }
);

export const modifyAppointment = ai.defineTool(
  // Define the Genkit tool for modifying or canceling an appointment.
  {
    name: 'modifyAppointment',
    description: 'modify or cancel an appointment. The customer may use relative date terms such as "tomorrow, next week, next month". use this as the hint for the date field',
    inputSchema: z.object({
      appointmentId: z.string().describe('existing appointment to modify or cancel'),
      action: z.enum(['MODIFY', 'CANCEL']).describe("if the customer wants to modify an appointment use MODIFY. If the intention is to cancel it use CANCEL"),
      date: z
        .string().optional()
        .describe('date of the appointment in YYYY-MM-DD. The user may use relative terms such as tomorrow, next week, next month. convert that into YYYY-MM-DD using today date'),
      time: z.string().optional().describe('time of the appointment in HH:mm'),
    }),

  },
  // The asynchronous function that executes the tool's logic.
  async ({ appointmentId, action, date, time }) => {

    try {
      const app = getFirebaseAdminApp();
      const firestore: Firestore = getFirestore(app);
      const appointmentsCollectionRef = firestore.collection('appointments');

      // Handle the MODIFY action.
      if (action === 'MODIFY') {
        // Parse the new date and time.
        const dateTime = new Date(`${date}T${time}`);
        const startTime = Timestamp.fromDate(dateTime);
        const endTime = Timestamp.fromDate(new Date(dateTime.getTime() + 60 * 60000)); // Assume 60-minute appointments
        await appointmentsCollectionRef.doc(appointmentId).update({
          // Update the date, startTime, and endTime fields.
          date: new Date(`${date}`),
          startTime: startTime,
          endTime: endTime,
        });

        return { success: true }
      }
      // Handle the CANCEL action.
      else if (action === 'CANCEL') {
        await appointmentsCollectionRef.doc(appointmentId).delete();
        return { success: true }
      }

    } catch (err) {
      console.error(err);

      return { success: false, message: 'Something went wrong' };
    }

  }
);