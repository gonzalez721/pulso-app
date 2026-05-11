import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useDisponibilidad, useBookSesion } from '../../hooks/useSesiones'
import { formatDate, getInitials } from '../../lib/utils'
import type { Asesor } from '../../types'

const TEMAS_PRESET = [
  'Control de gastos', 'Ahorro', 'Deudas', 'Presupuesto mensual',
  'Gastos impulsivos', 'Metas financieras', 'Apps de pago', 'Becas y apoyos',
]

interface Props {
  open: boolean
  onClose: () => void
}

export function BookSessionModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'date' | 'slot' | 'topics' | 'confirm' | 'success'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAsesor, setSelectedAsesor] = useState<Asesor | null>(null)
  const [selectedHora, setSelectedHora] = useState('')
  const [selectedTemas, setSelectedTemas] = useState<string[]>([])
  const [meetLink, setMeetLink] = useState('')
  const [copied, setCopied] = useState(false)

  const dateStr = selectedDate?.toISOString().split('T')[0]
  const { data: asesores, isLoading } = useDisponibilidad(dateStr)
  const { mutate: book, isPending, error } = useBookSesion()

  const today = new Date()
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Filter past slots when the selected date is today (with 30-min buffer)
  const filterSlots = (horas: string[], date: Date): string[] => {
    const isToday = date.toDateString() === today.toDateString()
    if (!isToday) return horas
    const cutoff = new Date(today.getTime() + 30 * 60 * 1000) // now + 30 min
    return horas.filter((hora) => {
      const [h, m] = hora.split(':').map(Number)
      const slot = new Date(date)
      slot.setHours(h, m, 0, 0)
      return slot > cutoff
    })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(meetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay()

  const toggleTema = (t: string) =>
    setSelectedTemas((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])

  const handleBook = () => {
    if (!selectedDate || !selectedAsesor || !selectedHora) return
    const [h, m] = selectedHora.split(':').map(Number)
    const fechaHora = new Date(selectedDate)
    fechaHora.setHours(h, m, 0, 0)

    book(
      { asesorId: selectedAsesor.id, fechaHora: fechaHora.toISOString(), temasAgenda: selectedTemas },
      {
        onSuccess: (sesion: any) => {
          setMeetLink(sesion.linkMeet ?? '')
          setStep('success')
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? 'Error desconocido'
          alert('Error al reservar: ' + msg)
        },
      }
    )
  }

  const reset = () => {
    setStep('date')
    setSelectedDate(null)
    setSelectedAsesor(null)
    setSelectedHora('')
    setSelectedTemas([])
    setMeetLink('')
    setCopied(false)
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Agendar sesión" fullScreen>
      <div className="px-5 py-4">
        {/* Step: Calendar */}
        {step === 'date' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-primary-dark/50 transition-colors"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
              <span className="font-bold text-white capitalize">
                {calMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center hover:border-primary-dark/50 transition-colors"
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-text-muted py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (getFirstDayOfMonth(calMonth) + 6) % 7 }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: getDaysInMonth(calMonth) }).map((_, i) => {
                const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)
                const isPast = d < today && d.toDateString() !== today.toDateString()
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                const isSelected = selectedDate?.toDateString() === d.toDateString()
                const disabled = isPast || isWeekend

                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => { setSelectedDate(d); setStep('slot') }}
                    className={`
                      aspect-square rounded-xl text-sm font-semibold transition-all
                      ${disabled ? 'text-text-dim cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-neon-green text-[#0A0A12]' : !disabled ? 'hover:bg-surface-elevated text-white' : ''}
                    `}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Step: Slots */}
        {step === 'slot' && selectedDate && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <button onClick={() => setStep('date')} className="flex items-center gap-1 text-sm text-text-muted font-semibold hover:text-white transition-colors">
              <ChevronLeft size={14} /> {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}
            </button>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-surface-elevated rounded-2xl animate-pulse border border-border-light" />)}
              </div>
            ) : (
              (asesores ?? []).map((asesor) => {
                const slots = filterSlots(asesor.horasDisponibles ?? [], selectedDate)
                return slots.length > 0 ? (
                  <div key={asesor.id} className="bg-surface-raised border border-border-light rounded-3xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-light flex items-center justify-center overflow-hidden">
                        {asesor.fotoUrl ? (
                          <img src={asesor.fotoUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-sm font-bold text-primary-dark">{getInitials(asesor.nombre)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{asesor.nombre}</p>
                        <p className="text-xs text-text-muted">{asesor.carrera}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((hora) => (
                        <button
                          key={hora}
                          onClick={() => { setSelectedAsesor(asesor); setSelectedHora(hora); setStep('topics') }}
                          className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-light text-white text-sm font-bold hover:bg-neon-green hover:text-[#0A0A12] hover:border-neon-green transition-all"
                        >
                          {hora}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })
            )}

            {!isLoading && asesores?.every((a) => filterSlots(a.horasDisponibles ?? [], selectedDate).length === 0) && (
              <div className="text-center py-8 text-text-muted">
                <p className="text-3xl mb-2">📅</p>
                <p className="font-semibold">Sin horarios disponibles este día</p>
                <button onClick={() => setStep('date')} className="text-sm text-neon-green font-bold mt-2">
                  Elegir otro día
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step: Topics */}
        {step === 'topics' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <button onClick={() => setStep('slot')} className="flex items-center gap-1 text-sm text-text-muted font-semibold hover:text-white transition-colors">
              <ChevronLeft size={14} /> Temas a tratar
            </button>
            <p className="text-sm text-text-muted">Selecciona los temas que quieres discutir (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {TEMAS_PRESET.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTema(t)}
                  className={`px-3 py-2 rounded-2xl text-sm font-semibold border-2 transition-all
                    ${selectedTemas.includes(t)
                      ? 'bg-primary-dark border-primary-dark text-white'
                      : 'bg-surface-elevated border-border-light text-text-muted hover:border-primary-dark/50 hover:text-white'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep('confirm')} fullWidth size="lg">
              Continuar
            </Button>
          </motion.div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedDate && selectedAsesor && selectedHora && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h3 className="font-bold text-white text-lg">Confirmar sesión</h3>
            <div className="bg-surface-elevated border border-border-light rounded-3xl p-5 space-y-3">
              <Row label="Asesor" value={selectedAsesor.nombre} />
              <Row label="Fecha" value={formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })} />
              <Row label="Hora" value={selectedHora} />
              <Row label="Duración" value="20 minutos" />
              {selectedTemas.length > 0 && (
                <Row label="Temas" value={selectedTemas.join(', ')} />
              )}
            </div>
            {error && (
              <p className="text-xs text-red-400 font-medium text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                Error: {(error as any)?.response?.data?.error ?? (error as any)?.message ?? 'No se pudo conectar al servidor'}
              </p>
            )}
            <Button onClick={handleBook} loading={isPending} fullWidth size="lg">
              ✅ Confirmar sesión
            </Button>
            <Button onClick={() => setStep('topics')} variant="ghost" fullWidth>
              Regresar
            </Button>
          </motion.div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-center py-2"
          >
            <div className="text-5xl">🎉</div>
            <div>
              <h3 className="font-extrabold text-white text-xl">¡Sesión confirmada!</h3>
              <p className="text-sm text-text-muted mt-1">
                Con {selectedAsesor?.nombre} el{' '}
                {selectedDate && formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedHora}
              </p>
            </div>

            {/* Link destacado */}
            <div
              className="rounded-3xl p-5 space-y-3 text-left"
              style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A1A4E 100%)', border: '1px solid rgba(124,77,255,0.3)' }}
            >
              <p className="text-text-muted text-xs font-bold uppercase tracking-wide">Tu link de reunión</p>
              <p className="text-white text-sm font-mono break-all leading-relaxed">{meetLink}</p>
              <div className="flex gap-2 pt-1">
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-neon-green text-[#0A0A12] font-bold text-sm hover:brightness-105 transition-all shadow-neon"
                >
                  <ExternalLink size={15} /> Entrar ahora
                </a>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-white/10 border border-border-light text-white font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <p className="text-xs text-text-muted">
              También puedes ver este link en cualquier momento desde la sección <strong className="text-white">Sesiones</strong>
            </p>

            <Button onClick={() => { reset(); onClose() }} fullWidth>
              Listo
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm text-text-muted font-medium">{label}</span>
      <span className="text-sm font-bold text-white text-right flex-1 ml-4">{value}</span>
    </div>
  )
}
