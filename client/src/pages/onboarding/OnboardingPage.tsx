import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WelcomeStep } from './steps/WelcomeStep'
import { ObjectiveStep } from './steps/ObjectiveStep'
import { HabitsStep } from './steps/HabitsStep'
import { BudgetStep } from './steps/BudgetStep'
import { CategoriesStep } from './steps/CategoriesStep'
import { useUpdateProfile } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export interface OnboardingData {
  objetivo: string
  dificultades: string[]
  presupuestoSemanal: number
  categorias: string[]
}

const TOTAL_STEPS = 5

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const { mutate, isPending } = useUpdateProfile()
  const navigate = useNavigate()

  const update = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }))

  const next = () => setStep((s) => s + 1)

  const finish = () => {
    const catMap: Record<string, number> = {}
    for (const c of data.categorias ?? []) catMap[c] = 20

    mutate(
      {
        objetivo: data.objetivo,
        categoriasGasto: catMap,
        dificultadesReportadas: data.dificultades,
        presupuestoSemanal: data.presupuestoSemanal,
        onboardingComplete: true,
      },
      { onSuccess: () => navigate('/dashboard') }
    )
  }

  const steps = [
    <WelcomeStep onNext={next} />,
    <ObjectiveStep onNext={(obj) => { update({ objetivo: obj }); next() }} />,
    <HabitsStep onNext={(difs) => { update({ dificultades: difs }); next() }} />,
    <BudgetStep onNext={(budget) => { update({ presupuestoSemanal: budget }); next() }} />,
    <CategoriesStep onNext={(cats) => { update({ categorias: cats }); finish() }} loading={isPending} />,
  ]

  return (
    <div className="min-h-screen bg-primary-light flex flex-col">
      {/* Progress bar */}
      {step > 0 && (
        <div className="px-6 pt-14 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: i < step ? '#2D1B4E' : '#E5E5E5',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="h-full"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
