import { prisma } from '../lib/prisma'
import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  if (!_openai) _openai = new OpenAI({ apiKey: key })
  return _openai
}

export interface RiesgoResult {
  nivel: 'bajo' | 'medio' | 'alto'
  razonesRiesgo: string[]
  score: number
}

// High-risk categories (impulse purchases)
const CATEGORIAS_RIESGO = ['Entretenimiento', 'Ropa', 'Otros', 'Comida']

export async function evaluarRiesgo(
  userId: string,
  monto: number,
  categoria: string,
): Promise<RiesgoResult> {
  const razonesRiesgo: string[] = []
  let score = 0

  const now = new Date()

  // 1. Get active weekly meta
  const meta = await prisma.meta.findFirst({
    where: {
      userId,
      activa: true,
      tipoMeta: 'SEMANAL',
      fechaInicio: { lte: now },
      fechaFin: { gte: now },
    },
  })

  // 2. Recent transactions this week
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const recentTx = await prisma.transaccion.findMany({
    where: { userId, fecha: { gte: weekStart } },
    orderBy: { fecha: 'desc' },
  })

  const weeklySpent = recentTx.reduce((s, t) => s + t.monto, 0)
  const newTotal = weeklySpent + monto

  // Rule 1: Budget percentage
  if (meta && meta.montoObjetivo > 0) {
    const currentPct = weeklySpent / meta.montoObjetivo
    const newPct = newTotal / meta.montoObjetivo

    if (newPct >= 1.0) {
      score += 40
      razonesRiesgo.push(`Superarás tu presupuesto semanal (${Math.round(newPct * 100)}% usado)`)
    } else if (newPct >= 0.85) {
      score += 25
      razonesRiesgo.push(`Llegarás al ${Math.round(newPct * 100)}% de tu presupuesto semanal`)
    } else if (newPct >= 0.70 && currentPct < 0.70) {
      score += 10
      razonesRiesgo.push(`Ya llevas el ${Math.round(newPct * 100)}% del presupuesto esta semana`)
    }

    // Rule 3: Single purchase is large relative to budget
    const purchasePct = monto / meta.montoObjetivo
    if (purchasePct >= 0.35) {
      score += 20
      razonesRiesgo.push(
        `Este gasto representa el ${Math.round(purchasePct * 100)}% de tu presupuesto semanal`,
      )
    }
  }

  // Rule 2: Category repeat this week
  const categoryCount = recentTx.filter((t) => t.categoria === categoria).length
  if (categoryCount >= 4) {
    score += 25
    razonesRiesgo.push(`Es tu ${categoryCount + 1}° gasto en ${categoria} esta semana`)
  } else if (categoryCount >= 2) {
    score += 12
    razonesRiesgo.push(`Ya tienes ${categoryCount} gastos en ${categoria} esta semana`)
  }

  // Rule 4: Today's purchase count
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayCount = recentTx.filter((t) => t.fecha >= todayStart).length
  if (todayCount >= 5) {
    score += 15
    razonesRiesgo.push(`Ya llevas ${todayCount + 1} gastos hoy`)
  }

  // Rule 5: High-risk impulse category
  if (CATEGORIAS_RIESGO.includes(categoria)) {
    score += 5
  }

  const nivel: RiesgoResult['nivel'] =
    score >= 40 ? 'alto' : score >= 20 ? 'medio' : 'bajo'

  return { nivel, razonesRiesgo, score }
}

export async function generarMensajeIA(params: {
  userNombre: string
  partnerNombre: string
  monto: number
  categoria: string
  razonesRiesgo: string[]
  weeklySpent: number
  presupuesto: number
}): Promise<string> {
  const openai = getOpenAI()
  if (!openai) {
    // Fallback without AI
    const pct = params.presupuesto > 0
      ? Math.round(((params.weeklySpent + params.monto) / params.presupuesto) * 100)
      : 0
    return `${params.userNombre} está a punto de gastar $${params.monto.toLocaleString('es-CO')} en ${params.categoria}. ${pct > 0 ? `Llevaría el ${pct}% de su presupuesto esta semana.` : ''} ¿Qué opinas?`
  }

  const prompt = `Eres PACTO, un asistente de responsabilidad financiera entre amigos.
Genera un mensaje CORTO y DIRECTO (máx 2 oraciones) para notificar al partner de un usuario sobre un gasto de riesgo.

Usuario: ${params.userNombre}
Partner: ${params.partnerNombre}
Gasto: $${params.monto.toLocaleString('es-CO')} en ${params.categoria}
Razones de riesgo: ${params.razonesRiesgo.join('. ')}
Presupuesto semanal: $${params.presupuesto.toLocaleString('es-CO')}
Gastado esta semana (sin este gasto): $${params.weeklySpent.toLocaleString('es-CO')}

El mensaje debe:
- Ser empático, no alarmista
- Mencionar el monto y categoría
- Incluir el contexto de riesgo más importante
- Terminar invitando al partner a opinar
- En español informal

Responde SOLO con el texto del mensaje, sin comillas.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 120,
    })
    return response.choices[0].message.content?.trim() ?? ''
  } catch {
    return `${params.userNombre} está por gastar $${params.monto.toLocaleString('es-CO')} en ${params.categoria}. ${params.razonesRiesgo[0] ?? ''} ¿Qué le dirías?`
  }
}
