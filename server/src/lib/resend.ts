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

const FROM = 'PULSO <no-reply@pulsopacto.online>'

// ─── Helper ─────────────────────────────────────────────────────────────────

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0A0A12; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:520px; margin:0 auto; padding:32px 16px; }
    .card { background:#13131F; border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:32px; }
    .logo { text-align:center; margin-bottom:28px; }
    .logo-icon { width:56px; height:56px; background:linear-gradient(135deg,#7C4DFF,#4a1adb); border-radius:14px; display:inline-flex; align-items:center; justify-content:center; font-size:26px; }
    .logo-name { color:#fff; font-size:22px; font-weight:800; margin-top:8px; letter-spacing:-0.5px; }
    .logo-sub { color:#888; font-size:12px; margin-top:3px; }
    h2 { color:#fff; font-size:20px; font-weight:700; margin-bottom:10px; }
    p { color:#aaa; font-size:14px; line-height:1.65; margin-bottom:12px; }
    .btn { display:block; text-align:center; background:linear-gradient(135deg,#7C4DFF,#5e35b1); color:#fff !important; font-weight:700; font-size:15px; padding:14px 28px; border-radius:12px; text-decoration:none; margin:20px 0; }
    .info-box { background:rgba(124,77,255,0.08); border:1px solid rgba(124,77,255,0.2); border-radius:12px; padding:16px; margin:16px 0; }
    .info-row { display:flex; gap:10px; margin-bottom:6px; font-size:13px; color:#ccc; }
    .info-label { color:#888; width:80px; flex-shrink:0; }
    .divider { height:1px; background:rgba(255,255,255,0.06); margin:20px 0; }
    .footer { text-align:center; margin-top:24px; color:#555; font-size:11px; line-height:1.6; }
    .green { color:#A8FF3E; }
    .tag { display:inline-block; background:rgba(168,255,62,0.1); border:1px solid rgba(168,255,62,0.2); color:#A8FF3E; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <div class="logo-name">PULSO</div>
        <div class="logo-sub">Acompañamiento Financiero Universitario</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      PULSO · Acompañamiento Financiero Universitario<br>
      Solo correos institucionales <span class="green">.edu.co</span>
    </div>
  </div>
</body>
</html>`
}

// ─── Email verification ──────────────────────────────────────────────────────

export async function sendVerificationEmail(params: {
  to: string
  nombre: string
  verifyUrl: string
  role: 'student' | 'mentor'
}): Promise<void> {
  const roleLabel = params.role === 'mentor' ? 'Mentor' : 'Estudiante'
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: '✅ Verifica tu correo — PULSO',
    html: baseHtml(`
      <span class="tag">${roleLabel}</span>
      <h2 style="margin-top:14px;">Verifica tu correo institucional</h2>
      <p>Hola <strong style="color:#fff;">${params.nombre}</strong>, bienvenido a PULSO.<br>
      Haz clic en el botón para activar tu cuenta.</p>
      <a href="${params.verifyUrl}" class="btn">Verificar mi correo →</a>
      <p style="font-size:12px;color:#666;">Este enlace expira en <strong style="color:#aaa;">24 horas</strong>.<br>
      Si no creaste esta cuenta, ignora este correo.</p>
    `),
  })
}

// ─── Welcome ─────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  nombre: string
  role: 'student' | 'mentor'
}): Promise<void> {
  const isStudent = params.role === 'student'
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `🎉 ¡Bienvenido a PULSO, ${params.nombre}!`,
    html: baseHtml(`
      <h2>¡Tu cuenta está activa! 🎉</h2>
      <p>Hola <strong style="color:#fff;">${params.nombre}</strong>,<br>
      tu correo fue verificado exitosamente. Ya puedes ingresar a PULSO.</p>
      ${isStudent ? `
      <div class="info-box">
        <p style="margin:0;font-size:13px;color:#ccc;"><strong style="color:#A8FF3E;">¿Qué sigue?</strong><br><br>
        📊 Completa tu perfil financiero<br>
        🎯 Crea tu primera meta de ahorro<br>
        📅 Agenda una sesión con un mentor<br>
        💸 Registra tus gastos diarios</p>
      </div>` : `
      <div class="info-box">
        <p style="margin:0;font-size:13px;color:#ccc;"><strong style="color:#A8FF3E;">¿Qué sigue?</strong><br><br>
        👤 Configura tu perfil de mentor<br>
        📅 Define tu disponibilidad<br>
        🎓 Espera solicitudes de sesiones de estudiantes</p>
      </div>`}
      <a href="https://client-silk-one.vercel.app/${isStudent ? 'login' : 'asesor/login'}" class="btn">Ingresar a PULSO →</a>
    `),
  })
}

// ─── Password reset ──────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(params: {
  to: string
  nombre: string
  resetUrl: string
}): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: '🔑 Restablecer contraseña — PULSO',
    html: baseHtml(`
      <h2>Restablecer contraseña</h2>
      <p>Hola <strong style="color:#fff;">${params.nombre}</strong>,<br>
      recibimos una solicitud para restablecer la contraseña de tu cuenta PULSO.</p>
      <a href="${params.resetUrl}" class="btn">Restablecer contraseña →</a>
      <div class="divider"></div>
      <p style="font-size:12px;color:#666;">
        Este enlace expira en <strong style="color:#aaa;">1 hora</strong>.<br>
        Si no solicitaste esto, ignora este correo — tu contraseña no cambiará.
      </p>
    `),
  })
}

// ─── Session confirmation ────────────────────────────────────────────────────

export async function sendSessionConfirmation(params: {
  to: string
  userName: string
  asesorName: string
  fechaHora: Date
  linkMeet?: string
  temas: string[]
}): Promise<void> {
  const fecha = params.fechaHora.toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const hora = params.fechaHora.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  })
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `📅 Sesión confirmada con ${params.asesorName} — PULSO`,
    html: baseHtml(`
      <h2>¡Sesión confirmada! 🎉</h2>
      <p>Hola <strong style="color:#fff;">${params.userName}</strong>, tu sesión de acompañamiento financiero ha sido agendada.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Mentor</span><span>${params.asesorName}</span></div>
        <div class="info-row"><span class="info-label">Fecha</span><span>${fecha}</span></div>
        <div class="info-row"><span class="info-label">Hora</span><span>${hora}</span></div>
        <div class="info-row"><span class="info-label">Duración</span><span>20 minutos</span></div>
        ${params.linkMeet ? `<div class="info-row"><span class="info-label">Link</span><a href="${params.linkMeet}" style="color:#A8FF3E;">${params.linkMeet}</a></div>` : ''}
        ${params.temas.length > 0 ? `<div class="info-row"><span class="info-label">Temas</span><span>${params.temas.join(', ')}</span></div>` : ''}
      </div>
      <p style="font-size:13px;">💡 <strong style="color:#fff;">Preparación:</strong> Revisa tus transacciones de la semana y ten listas tus preguntas.</p>
    `),
  })
}

// ─── Session cancellation ────────────────────────────────────────────────────

export async function sendSessionCancellation(params: {
  to: string
  userName: string
  asesorName: string
  fechaHora: Date
}): Promise<void> {
  const fecha = params.fechaHora.toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `Sesión cancelada — ${params.asesorName}`,
    html: baseHtml(`
      <h2>Sesión cancelada</h2>
      <p>Hola <strong style="color:#fff;">${params.userName}</strong>,<br>
      tu sesión con <strong style="color:#fff;">${params.asesorName}</strong> programada para el <strong style="color:#fff;">${fecha}</strong> ha sido cancelada.</p>
      <p>Puedes agendar una nueva sesión en cualquier momento desde la app.</p>
      <a href="https://client-silk-one.vercel.app/sessions" class="btn">Agendar nueva sesión →</a>
    `),
  })
}
