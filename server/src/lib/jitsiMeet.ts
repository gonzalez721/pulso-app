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

  return {
    linkMeet: `https://framatalk.org/${roomName}`,
    googleCalendarEventId: null,
    calendarEventUrl: null,
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
