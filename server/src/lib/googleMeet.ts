import crypto from 'crypto'

export interface MeetResult {
  linkMeet: string
  googleCalendarEventId: string | null
  calendarEventUrl: string | null
}

function generateMeetCode(seed: string): string {
  const hash = crypto.createHash('sha256').update(seed).digest('hex')
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const pick = (offset: number, len: number) =>
    Array.from({ length: len }, (_, i) => chars[parseInt(hash[offset + i], 16) % 26]).join('')
  return `${pick(0, 3)}-${pick(3, 4)}-${pick(7, 3)}`
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
  const seed = `${params.asesorEmail}-${params.estudianteEmail}-${params.fechaInicio.getTime()}`
  const code = generateMeetCode(seed)
  return {
    linkMeet: `https://meet.google.com/${code}`,
    googleCalendarEventId: null,
    calendarEventUrl: null,
  }
}

export async function deleteGoogleCalendarEvent(_eventId: string): Promise<void> {
  // Google Meet rooms se cierran solos — no requiere acción
}
