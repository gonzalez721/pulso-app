import crypto from 'crypto'

export interface MeetResult {
  linkMeet: string
  googleCalendarEventId: string | null
  calendarEventUrl: string | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-').slice(0, 2).join('-')
}

function shortHash(estudiante: string, asesor: string, fecha: Date): string {
  const base = `${estudiante}-${asesor}-${fecha.getTime()}`
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 6)
}

export async function createMeetSession(params: {
  titulo: string
  descripcion: string
  fechaInicio: Date
  duracionMin: number
  asesorEmail: string
  estudianteEmail: string
  asesorNombre: string
  estudianteNombre: string
}): Promise<MeetResult> {
  const asesorSlug = slugify(params.asesorNombre)
  const estudianteSlug = slugify(params.estudianteNombre)
  const hash = shortHash(params.estudianteEmail, params.asesorEmail, params.fechaInicio)
  const roomName = `pulso-${asesorSlug}-${estudianteSlug}-${hash}`

  const fallbackUrl = `https://pulsopacto.daily.co/${roomName}`
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) return { linkMeet: fallbackUrl, googleCalendarEventId: null, calendarEventUrl: null }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          exp: Math.floor(params.fechaInicio.getTime() / 1000) + params.duracionMin * 60 + 3600,
          enable_prejoin_ui: false,
        },
      }),
    })

    if (response.status === 409) {
      return { linkMeet: fallbackUrl, googleCalendarEventId: null, calendarEventUrl: null }
    }

    if (!response.ok) {
      return { linkMeet: fallbackUrl, googleCalendarEventId: null, calendarEventUrl: null }
    }

    const data = await response.json() as { url: string }
    return { linkMeet: data.url, googleCalendarEventId: null, calendarEventUrl: null }
  } catch {
    return { linkMeet: fallbackUrl, googleCalendarEventId: null, calendarEventUrl: null }
  }
}

export async function deleteMeetSession(roomName: string): Promise<void> {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) return
  await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${apiKey}` },
  }).catch(() => {})
}
