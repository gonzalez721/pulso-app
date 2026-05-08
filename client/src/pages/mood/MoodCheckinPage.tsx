import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useSaveMood } from '../../hooks/useInsights'

const MOODS = [
  { key: 'great',    emoji: '😄', label: 'Genial',     color: '#22C55E' },
  { key: 'good',     emoji: '🙂', label: 'Bien',       color: '#3B82F6' },
  { key: 'neutral',  emoji: '😐', label: 'Regular',    color: '#F59E0B' },
  { key: 'stressed', emoji: '😰', label: 'Estresado',  color: '#F97316' },
  { key: 'bad',      emoji: '😔', label: 'Mal',        color: '#EF4444' },
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
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-dark/15 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="saved"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <span className="text-6xl">✅</span>
            <p className="text-xl font-bold text-white mt-4">¡Gracias por compartir!</p>
            <p className="text-text-muted mt-1">Regresando al inicio…</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-8 relative z-10"
          >
            <div className="text-center">
              <h1 className="text-2xl font-extrabold font-display text-white">
                ¿Cómo te sientes hoy?
              </h1>
              <p className="text-text-muted mt-1 text-sm">
                Tu bienestar también influye en tus finanzas
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {MOODS.map((m, i) => (
                <motion.button
                  key={m.key}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelected(m.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl border-2 transition-all ${
                    selected === m.key
                      ? 'scale-110'
                      : 'border-border-light bg-surface-raised hover:border-border-light/80'
                  }`}
                  style={selected === m.key ? {
                    backgroundColor: m.color + '20',
                    borderColor: m.color,
                    boxShadow: `0 0 20px ${m.color}30`,
                  } : {}}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-[10px] font-bold text-text-muted">{m.label}</span>
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
                  className="w-full rounded-2xl border border-border-light bg-surface-elevated p-4 text-sm text-white placeholder:text-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark/40"
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
