import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatDate, formatTime, getInitials } from '../../lib/utils'
import { useCancelSesion } from '../../hooks/useSesiones'
import type { Sesion } from '../../types'
import { ExternalLink, Clock, CheckSquare } from 'lucide-react'

const PREP_CHECKLIST = [
  'Revisa tus transacciones de la semana',
  'Identifica tu categoría de mayor gasto',
  'Piensa en tu meta de la próxima semana',
  'Ten lista tu pregunta principal',
]

interface Props {
  sesion: Sesion | null
  onClose: () => void
}

export function SessionDetailModal({ sesion, onClose }: Props) {
  const { mutate: cancel, isPending } = useCancelSesion()

  if (!sesion) return null

  const isProgramada = sesion.estado === 'programada' && new Date(sesion.fechaHora) >= new Date()

  return (
    <Modal open={!!sesion} onClose={onClose} title="Detalle de sesión">
      <div className="px-5 py-4 space-y-5">
        {/* Asesor info */}
        <div className="flex items-center gap-4 bg-primary-light rounded-3xl p-4">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            {sesion.asesor.fotoUrl ? (
              <img src={sesion.asesor.fotoUrl} alt={sesion.asesor.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary-dark">{getInitials(sesion.asesor.nombre)}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-primary-dark text-lg">{sesion.asesor.nombre}</p>
            <p className="text-sm text-text-muted">{sesion.asesor.carrera} · Sem. {sesion.asesor.semestre}</p>
            {sesion.asesor.bio && (
              <p className="text-xs text-text-muted mt-1 line-clamp-2">{sesion.asesor.bio}</p>
            )}
          </div>
        </div>

        {/* Date/time/duration */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Fecha', value: formatDate(sesion.fechaHora, { weekday: 'short', day: 'numeric', month: 'short' }) },
            { label: 'Hora', value: formatTime(sesion.fechaHora) },
            { label: 'Duración', value: `${sesion.duracionMin} min` },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-text-muted font-medium">{item.label}</p>
              <p className="font-bold text-primary-dark text-sm mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Topics */}
        {sesion.temasAgenda.length > 0 && (
          <div>
            <h3 className="font-bold text-primary-dark mb-2">Temas a tratar</h3>
            <div className="flex flex-wrap gap-2">
              {sesion.temasAgenda.map((t) => (
                <span key={t} className="bg-accent-peach/60 text-primary-dark text-xs font-semibold px-3 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Jitsi Meet link */}
        {sesion.linkMeet && isProgramada && (
          <div className="space-y-2">
            <a
              href={sesion.linkMeet}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-[#2D1B4E] text-white font-bold text-sm hover:bg-[#3d2566] transition-colors"
            >
              <ExternalLink size={16} /> Unirse a la reunión
            </a>
            <p className="text-[10px] text-center text-gray-400 break-all px-1">{sesion.linkMeet}</p>
          </div>
        )}

        {/* Prep checklist */}
        {isProgramada && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare size={16} className="text-primary-dark" />
              <h3 className="font-bold text-primary-dark">Preparación</h3>
            </div>
            <div className="space-y-2">
              {PREP_CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary-dark/30 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-text-dark">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observations (post-session) */}
        {sesion.observaciones && (
          <div className="bg-primary-light rounded-2xl p-4">
            <h3 className="font-bold text-primary-dark mb-2">Notas de la sesión</h3>
            {sesion.observaciones.notasImportantes && (
              <p className="text-sm text-text-dark">{sesion.observaciones.notasImportantes}</p>
            )}
            {sesion.observaciones.compromisosProximaSemana.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-1">Compromisos</p>
                {sesion.observaciones.compromisosProximaSemana.map((c) => (
                  <p key={c} className="text-sm text-text-dark">• {c}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isProgramada && (
          <Button
            variant="danger"
            fullWidth
            loading={isPending}
            onClick={() => cancel(sesion.id, { onSuccess: onClose })}
          >
            Cancelar sesión
          </Button>
        )}
      </div>
    </Modal>
  )
}
