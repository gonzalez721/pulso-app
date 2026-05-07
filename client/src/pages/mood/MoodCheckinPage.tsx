import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useSaveMood } from '../../hooks/useInsights'

const MOODS = [
  { key: 'great', emoji: '😄', label: 'Genial', color: '#B8E8C8' },
  { key: 'good', emoji: '🙂', label: 'Bien', color: '#B8D4E8' },
  { key: 'neutral', emoji: '😐', label: 'Regular', color: '#E8D4B8' },
  { key: 'stressed', emoji: '😰', label: 'Estresado', color: '#FFD4C8' },
  { key: 'bad', emoji: '😔', label: 'Mal', color: '#FF9B9B' },
]

export function MoodCheckinPage() {
  const [selected, setSelected] = useState('')
  const [nota, setNota] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutate, isPending } = useSaveMood()
  const navigate = useNavigate()

  const handleSave = () => {
    if (!selected) return
    mutate(
      { mood: selected, nota: nota || undefined },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => navigate('/dashboard'), 1500)
        },
      }
    )
  }

  return (
    <div className="min-h-screen bg-primary-light flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="saved"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <span className="text-6xl">✅</span>
            <p className="text-xl font-bold text-primary-dark mt-4">¡Gracias por compartir!</p>
            <p className="text-text-muted mt-1">Regresando al inicio…</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="text-center">
              <h1 className="text-2xl font-extrabold font-display text-primary-dark">
                ¿Cómo te sientes hoy?
              </h1>
              <p className="text-text-muted mt-1 text-sm">
                Tu bienestar también influye en tus finanzas
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {MOODS.map((m, i) => (
                <motion.button
                  key={m.key}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelected(m.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-3xl border-2 transition-all ${
                    selected === m.key
                      ? 'border-primary-dark scale-110 shadow-card'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: m.color + (selected === m.key ? 'FF' : '60') }}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-[10px] font-bold text-primary-dark">{m.label}</span>
                </motion.button>
              ))}
            </div>

            {selected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="¿Algo más que quieras compartir? (opcional)"
                  rows={3}
                  className="w-full rounded-2xl border border-border-light bg-white p-4 text-sm text-text-dark placeholder:text-text-muted/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={!selected}
                loading={isPending}
                fullWidth
                size="lg"
              >
                Guardar
              </Button>
              <Button onClick={() => navigate(-1)} variant="ghost" fullWidth>
                Omitir
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
