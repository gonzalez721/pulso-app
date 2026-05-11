import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TourState {
  studentDone: boolean
  asesorDone: boolean
  markStudentDone: () => void
  markAsesorDone: () => void
  resetStudentTour: () => void
  resetAsesorTour: () => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      studentDone: false,
      asesorDone: false,
      markStudentDone: () => set({ studentDone: true }),
      markAsesorDone:  () => set({ asesorDone: true }),
      resetStudentTour: () => set({ studentDone: false }),
      resetAsesorTour:  () => set({ asesorDone: false }),
    }),
    { name: 'pulso-tour' }
  )
)
