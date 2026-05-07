import crypto from 'crypto'

export interface MeetResult {
  linkMeet: string
  googleCalendarEventId: string | null
  calendarEventUrl: string | null
}

function generateRoomName(params: {
  asesorEmail: string
  estudianteEmail: string
  fechaInicio: Date
}): string {
  const seed = `${params.asesorEmail}-${params.estudianteEmail}-${params.fechaInicio.getTime()}`
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8)
  return `pulso-${hash}`
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
  const room = generateRoomName(params)
  return {
    linkMeet: `https://8x8.vc/${room}`,
    googleCalendarEventId: null,
    calendarEventUrl: null,
  }
}

export async function deleteGoogleCalendarEvent(_eventId: string): Promise<void> {
  // Google Meet rooms se cierran solos — no requiere acción
}
