import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error('OPENAI_API_KEY no configurada')
    _openai = new OpenAI({ apiKey: key })
  }
  return _openai
}

export interface InsightItem {
  titulo: string
  descripcion: string
  icono: string
}

export async function generateWeeklyInsights(
  transacciones: Array<{ monto: number; categoria: string; descripcion?: string | null; fecha: Date }>,
  presupuesto: number
): Promise<InsightItem[]> {
  const total = transacciones.reduce((s, t) => s + t.monto, 0)
  const byCategory: Record<string, number> = {}
  for (const t of transacciones) {
    byCategory[t.categoria] = (byCategory[t.categoria] ?? 0) + t.monto
  }

  const prompt = `Eres un asesor financiero universitario. Analiza las siguientes transacciones de la semana y genera exactamente 3 insights clave en JSON.

Transacciones: ${JSON.stringify(transacciones.map(t => ({ monto: t.monto, categoria: t.categoria, descripcion: t.descripcion })))}
Total gastado: $${total.toFixed(2)}
Presupuesto semanal: $${presupuesto.toFixed(2)}
Por categoría: ${JSON.stringify(byCategory)}

Responde SOLO con un array JSON válido con exactamente 3 objetos, cada uno con:
- titulo: string corto (máx 6 palabras)
- descripcion: string explicativo (máx 20 palabras)
- icono: un emoji relevante

Ejemplo: [{"titulo":"Gasto en comida alto","descripcion":"Gastaste 40% más en comida que la semana pasada","icono":"🍕"}]`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400,
    })

    const content = response.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(content)
    const insights: InsightItem[] = parsed.insights ?? parsed

    if (Array.isArray(insights) && insights.length > 0) {
      return insights.slice(0, 3)
    }
  } catch {
    // Fall through to defaults
  }

  return getDefaultInsights(total, presupuesto, byCategory)
}

export async function generateUserProfileSummary(data: {
  objetivo: string
  categorias: string[]
  dificultades: string[]
  presupuesto: number
}): Promise<string> {
  const prompt = `Eres un asesor financiero universitario amigable. Genera un resumen personalizado corto (máx 2 oraciones) sobre el perfil financiero de este estudiante.

Objetivo: ${data.objetivo}
Categorías de gasto frecuentes: ${data.categorias.join(', ')}
Dificultades: ${data.dificultades.join(', ')}
Presupuesto semanal: $${data.presupuesto}

Responde con texto directo, sin JSON, en español, de forma motivadora y específica.`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    })
    return response.choices[0].message.content ?? ''
  } catch {
    return 'Tu perfil financiero ha sido configurado. Estamos listos para ayudarte a alcanzar tus metas.'
  }
}

function getDefaultInsights(
  total: number,
  presupuesto: number,
  byCategory: Record<string, number>
): InsightItem[] {
  const pct = presupuesto > 0 ? (total / presupuesto) * 100 : 0
  const topCategory = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]

  return [
    {
      titulo: pct > 100 ? 'Presupuesto superado' : 'Buen control del presupuesto',
      descripcion: pct > 100
        ? `Gastaste ${(pct - 100).toFixed(0)}% más de tu meta semanal`
        : `Utilizaste ${pct.toFixed(0)}% de tu presupuesto esta semana`,
      icono: pct > 100 ? '⚠️' : '✅',
    },
    {
      titulo: `Mayor gasto: ${topCategory?.[0] ?? 'Varios'}`,
      descripcion: topCategory
        ? `$${topCategory[1].toFixed(0)} en ${topCategory[0]}, el ${((topCategory[1] / total) * 100).toFixed(0)}% del total`
        : 'Revisa tu categoría principal de gasto',
      icono: '📊',
    },
    {
      titulo: 'Consistencia es clave',
      descripcion: 'Registrar todos tus gastos te ayuda a identificar patrones y ahorrar más',
      icono: '💡',
    },
  ]
}
