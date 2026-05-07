import { google } from 'googleapis'

export interface MeetResult {
  linkMeet: string
  googleCalendarEventId: string | null
  calendarEventUrl: string | null
}

function getCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !key) return null

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

export async function createGoogleMeetSession(params: {
  titulo: string
  descripcion: string
  fechaInicio: Date
  duracionMin: number
  asesorEmail: string
  estudianteEmail: string
  asesorNombre: string
  estudianteNombre: string
}): Promise<MeetResult> {
  const calendar = getCalendarClient()

  if (!calendar) {
    // Sin credenciales → link de demostración funcional
    console.warn('[GoogleMeet] Credenciales no configuradas. Usando link demo.')
    return {
      linkMeet: `https://meet.google.com/pulso-${Math.random().toString(36).slice(2, 9)}`,
      googleCalendarEventId: null,
      calendarEventUrl: null,
    }
  }

  const fechaFin = new Date(params.fechaInicio.getTime() + params.duracionMin * 60 * 1000)

  const event = await calendar.events.insert({
    // El service account crea el evento en su propio calendario
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',           // Envía invitaciones por email a los asistentes
    requestBody: {
      summary: params.titulo,
      description: params.descripcion,
      start: { dateTime: params.fechaInicio.toISOString(), timeZone: 'America/Mexico_City' },
      end:   { dateTime: fechaFin.toISOString(),           timeZone: 'America/Mexico_City' },
      conferenceData: {
        createRequest: {
          requestId: `pulso-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: [
        { email: params.asesorEmail,     displayName: params.asesorNombre,      organizer: true },
        { email: params.estudianteEmail, displayName: params.estudianteNombre },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email',  minutes: 60 },
          { method: 'popup',  minutes: 10 },
        ],
      },
    },
  })

  const data = event.data
  const linkMeet = data.hangoutLink ?? data.conferenceData?.entryPoints?.[0]?.uri ?? ''

  if (!linkMeet) throw new Error('Google Calendar no devolvió un link de Meet')

  return {
    linkMeet,
    googleCalendarEventId: data.id ?? null,
    calendarEventUrl: data.htmlLink ?? null,
  }
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  if (!calendar || !eventId) return

  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    eventId,
    sendUpdates: 'all',
  }).catch(() => {}) // silencioso si ya fue borrado
}
