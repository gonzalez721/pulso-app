import crypto from 'crypto'

export interface MeetResult {
  linkMeet: string
  googleCalendarEventId: string | null
  calendarEventUrl: string | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-').slice(0, 2).join('-') // solo primeras 2 palabras
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
  const asesorSlug    = slugify(params.asesorNombre)
  const estudianteSlug = slugify(params.estudianteNombre)
  const mes = params.fechaInicio.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    .replace(/ /g, '').replace('.', '').toLowerCase()
  const hash = shortHash(params.estudianteEmail, params.asesorEmail, params.fechaInicio)

  // Ej: pulso-sofia-ramirez-carlos-lopez-07may-a3f9b2
  const roomName = `pulso-${asesorSlug}-${estudianteSlug}-${mes}-${hash}`

  return {
    linkMeet: `https://meet.jit.si/${roomName}`,
    googleCalendarEventId: null,
    calendarEventUrl: null,
  }
}

// Kept for compatibility — Jitsi rooms don't need explicit deletion
export async function deleteMeetSession(_eventId: string): Promise<void> {}
