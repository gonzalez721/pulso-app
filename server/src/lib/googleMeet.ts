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
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 10)
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
  const roomName = generateRoomName(params)
  const apiKey = process.env.DAILY_API_KEY

  if (apiKey) {
    try {
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          name: roomName,
          privacy: 'public',
          properties: {
            enable_prejoin_ui: false,
            exp: Math.floor(params.fechaInicio.getTime() / 1000) + params.duracionMin * 60 + 7200,
          },
        }),
      })
      if (res.ok || res.status === 409) {
        const data = res.ok ? await res.json() as { url: string } : null
        return {
          linkMeet: data?.url ?? `https://pulsopacto.daily.co/${roomName}`,
          googleCalendarEventId: null,
          calendarEventUrl: null,
        }
      }
    } catch { /* fallback */ }
  }

  return {
    linkMeet: `https://pulsopacto.daily.co/${roomName}`,
    googleCalendarEventId: null,
    calendarEventUrl: null,
  }
}

export async function deleteGoogleCalendarEvent(_eventId: string): Promise<void> {
  // Google Meet rooms se cierran solos — no requiere acción
}
