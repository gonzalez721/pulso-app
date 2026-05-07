import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY not configured')
    _resend = new Resend(key)
  }
  return _resend
}

export async function sendSessionConfirmation(params: {
  to: string
  userName: string
  asesorName: string
  fechaHora: Date
  linkZoom?: string
  temas: string[]
}): Promise<void> {
  const fecha = params.fechaHora.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hora = params.fechaHora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  await getResend().emails.send({
    from: 'PULSO <sesiones@pulso.app>',
    to: params.to,
    subject: `✅ Sesión confirmada con ${params.asesorName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1A1A1A;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #2D1B4E; font-size: 28px; margin: 0;">PULSO</h1>
    <p style="color: #6B6B6B; margin: 4px 0 0;">Acompañamiento Financiero Universitario</p>
  </div>

  <div style="background: #F5E6E8; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #2D1B4E; margin: 0 0 8px;">¡Sesión confirmada! 🎉</h2>
    <p style="color: #6B6B6B; margin: 0;">Hola <strong>${params.userName}</strong>, tu sesión ha sido agendada.</p>
  </div>

  <div style="background: #fff; border: 1px solid #E5E5E5; border-radius: 16px; padding: 24px; margin-bottom: 16px;">
    <h3 style="color: #2D1B4E; margin: 0 0 16px;">Detalles de la sesión</h3>
    <p><strong>Asesor:</strong> ${params.asesorName}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Hora:</strong> ${hora}</p>
    <p><strong>Duración:</strong> 20 minutos</p>
    ${params.linkZoom ? `<p><strong>Link:</strong> <a href="${params.linkZoom}" style="color: #2D1B4E;">${params.linkZoom}</a></p>` : ''}
    ${params.temas.length > 0 ? `<p><strong>Temas:</strong> ${params.temas.join(', ')}</p>` : ''}
  </div>

  <div style="background: #FFD4C8; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #2D1B4E; font-size: 14px;">
      💡 <strong>Preparación:</strong> Revisa tus transacciones de la semana y ten a mano tus preguntas.
    </p>
  </div>

  <p style="color: #6B6B6B; font-size: 12px; text-align: center;">
    PULSO · Acompañamiento Financiero Universitario<br>
    Si tienes dudas, responde este correo.
  </p>
</body>
</html>`,
  })
}

export async function sendSessionCancellation(params: {
  to: string
  userName: string
  asesorName: string
  fechaHora: Date
}): Promise<void> {
  const fecha = params.fechaHora.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  await getResend().emails.send({
    from: 'PULSO <sesiones@pulso.app>',
    to: params.to,
    subject: `Sesión cancelada — ${params.asesorName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1A1A1A;">
  <h1 style="color: #2D1B4E;">PULSO</h1>
  <p>Hola <strong>${params.userName}</strong>,</p>
  <p>Tu sesión con <strong>${params.asesorName}</strong> programada para el <strong>${fecha}</strong> ha sido cancelada.</p>
  <p>Puedes agendar una nueva sesión en cualquier momento desde la app.</p>
  <p style="color: #6B6B6B; font-size: 12px;">PULSO · Acompañamiento Financiero Universitario</p>
</body>
</html>`,
  })
}
