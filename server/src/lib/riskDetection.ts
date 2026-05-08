import { prisma } from './prisma'

export interface RiskSignal {
  tipo:        string
  peso:        number   // 0–1
  descripcion: string
}

export interface RiskResult {
  puntuacion:   number        // 0–1 combined score
  esRiesgo:     boolean       // true if score > threshold
  signals:      RiskSignal[]
  contexto: {
    monto:                 number
    categoria:             string
    descripcion?:          string
    porcentajePresupuesto: number
    nComprasHoy:           number
    nComprasMismaCategoria: number
    velocidadVsPromedio:   number   // ratio: 1.0 = mismo ritmo, 1.5 = 50% más rápido
    diaAltoRiesgo:         boolean
    horaAltoRiesgo:        boolean
  }
}

const RISK_THRESHOLD = 0.45
const DIAS_ALTO_RIESGO = [4, 5, 6]  // Jueves(4), Viernes(5), Sábado(6) — 0=Domingo
const HORAS_ALTO_RIESGO = [20, 21, 22, 23]  // 8–11pm

export async function evaluarRiesgo(
  userId:    string,
  monto:     number,
  categoria: string,
  descripcion?: string
): Promise<RiskResult> {
  const ahora = new Date()
  const signals: RiskSignal[] = []

  // ── Helpers ──────────────────────────────────────────────────────────────
  const inicioHoy    = new Date(ahora); inicioHoy.setHours(0, 0, 0, 0)
  const inicio4sem   = new Date(ahora); inicio4sem.setDate(ahora.getDate() - 28)
  const hace2horas   = new Date(ahora); hace2horas.setHours(ahora.getHours() - 2)
  const inicioSemAct = new Date(ahora); inicioSemAct.setDate(ahora.getDate() - ahora.getDay())
  inicioSemAct.setHours(0, 0, 0, 0)

  // ── Cargar datos en paralelo ──────────────────────────────────────────────
  const [
    transaccionesHoy,
    transacciones4sem,
    transaccionesSemAct,
    metaActiva,
  ] = await Promise.all([
    prisma.transaccion.findMany({
      where: { userId, fecha: { gte: inicioHoy } },
      select: { monto: true, categoria: true, fecha: true },
    }),
    prisma.transaccion.findMany({
      where: { userId, fecha: { gte: inicio4sem, lt: inicioSemAct } },
      select: { monto: true, fecha: true },
    }),
    prisma.transaccion.findMany({
      where: { userId, fecha: { gte: inicioSemAct } },
      select: { monto: true },
    }),
    prisma.meta.findFirst({
      where: { userId, activa: true },
    }),
  ])

  // ── 1. Presupuesto consumido ──────────────────────────────────────────────
  const gastadoSemAct = transaccionesSemAct.reduce((s, t) => s + t.monto, 0) + monto
  const presupuesto   = metaActiva?.montoObjetivo ?? 0
  const pctPresupuesto = presupuesto > 0
    ? Math.round((gastadoSemAct / presupuesto) * 100)
    : 0

  if (presupuesto > 0) {
    if (pctPresupuesto >= 90) {
      signals.push({ tipo: 'presupuesto_critico', peso: 0.50,
        descripcion: `Llevas el ${pctPresupuesto}% del presupuesto semanal` })
    } else if (pctPresupuesto >= 70) {
      signals.push({ tipo: 'presupuesto_alto', peso: 0.25,
        descripcion: `Llevas el ${pctPresupuesto}% del presupuesto semanal` })
    }
  }

  // ── 2. Compras seguidas (ventana 2 h) ────────────────────────────────────
  const nRecientes = transaccionesHoy.filter(t => t.fecha >= hace2horas).length
  if (nRecientes >= 3) {
    signals.push({ tipo: 'compras_seguidas', peso: 0.40,
      descripcion: `${nRecientes + 1}ª compra en las últimas 2 horas — patrón de gasto emocional` })
  } else if (nRecientes === 2) {
    signals.push({ tipo: 'compras_seguidas_leve', peso: 0.15,
      descripcion: `3ª compra en las últimas 2 horas` })
  }

  // ── 3. Velocidad vs semanas anteriores ────────────────────────────────────
  let velocidadRatio = 1
  if (transacciones4sem.length > 0) {
    // Avg weekly spend in past 4 weeks
    const totalPasado = transacciones4sem.reduce((s, t) => s + t.monto, 0)
    const avgSemanal  = totalPasado / 4
    if (avgSemanal > 0) {
      velocidadRatio = gastadoSemAct / avgSemanal
      if (velocidadRatio >= 1.6) {
        signals.push({ tipo: 'velocidad_muy_alta', peso: 0.45,
          descripcion: `Gastando ${Math.round((velocidadRatio - 1) * 100)}% más rápido que tu promedio` })
      } else if (velocidadRatio >= 1.3) {
        signals.push({ tipo: 'velocidad_alta', peso: 0.20,
          descripcion: `Gastando ${Math.round((velocidadRatio - 1) * 100)}% más rápido que semanas anteriores` })
      }
    }
  }

  // ── 4. Misma categoría repetida hoy ────────────────────────────────────────
  const nMismaCategoria = transaccionesHoy.filter(
    t => t.categoria.toLowerCase() === categoria.toLowerCase()
  ).length
  if (nMismaCategoria >= 2) {
    signals.push({ tipo: 'categoria_repetida', peso: 0.30,
      descripcion: `${nMismaCategoria + 1}ª compra hoy en ${categoria}` })
  }

  // ── 5. Día/hora de alto riesgo ────────────────────────────────────────────
  const esHorario = HORAS_ALTO_RIESGO.includes(ahora.getHours())
  const esDia     = DIAS_ALTO_RIESGO.includes(ahora.getDay())
  if (esDia && esHorario) {
    signals.push({ tipo: 'horario_impulso', peso: 0.20,
      descripcion: `Jueves/viernes por la noche — momento de alta impulsividad` })
  } else if (esDia || esHorario) {
    signals.push({ tipo: 'horario_riesgo_leve', peso: 0.08,
      descripcion: `Horario con historial de compras impulsivas` })
  }

  // ── Calcular puntuación final (suma ponderada, cap 1.0) ──────────────────
  const puntuacion = Math.min(
    signals.reduce((s, sig) => s + sig.peso, 0),
    1.0
  )

  return {
    puntuacion,
    esRiesgo: puntuacion >= RISK_THRESHOLD,
    signals,
    contexto: {
      monto,
      categoria,
      descripcion,
      porcentajePresupuesto: pctPresupuesto,
      nComprasHoy:           transaccionesHoy.length + 1,
      nComprasMismaCategoria: nMismaCategoria + 1,
      velocidadVsPromedio:   Math.round(velocidadRatio * 10) / 10,
      diaAltoRiesgo:         esDia,
      horaAltoRiesgo:        esHorario,
    },
  }
}

// ── Mensaje automático contextual ──────────────────────────────────────────────
export function generarMensajeAuto(
  result: RiskResult,
  userName: string,
  modo: 'auto_partner' | 'ia'
): string {
  const { signals, contexto } = result
  const { nComprasHoy, nComprasMismaCategoria, porcentajePresupuesto, velocidadVsPromedio } = contexto

  const partes: string[] = []

  // Pick the most relevant signal to lead with
  if (signals.find(s => s.tipo === 'compras_seguidas' || s.tipo === 'compras_seguidas_leve')) {
    partes.push(`Es tu ${nComprasHoy}ª compra en poco tiempo`)
  }
  if (signals.find(s => s.tipo === 'categoria_repetida')) {
    partes.push(`ya compraste en ${contexto.categoria} ${nComprasMismaCategoria - 1} vez hoy`)
  }
  if (signals.find(s => s.tipo.startsWith('presupuesto'))) {
    partes.push(`llevas el ${porcentajePresupuesto}% del presupuesto esta semana`)
  }
  if (signals.find(s => s.tipo.startsWith('velocidad'))) {
    partes.push(`estás gastando ${Math.round((velocidadVsPromedio - 1) * 100)}% más rápido que otras semanas`)
  }

  const contextoStr = partes.length > 0
    ? partes.join(' y ') + '.'
    : 'el sistema detectó un patrón inusual.'

  if (modo === 'ia') {
    return `Oye ${userName}, antes de confirmar: ${contextoStr} ¿Esta compra era del plan o la agregaste recién?`
  }

  return `Tu partner PACTO no pudo responder a tiempo. Igual queríamos recordarte que ${contextoStr} Solo vos sabés si esta compra vale la pena. 💛`
}
