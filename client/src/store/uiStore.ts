import { create } from 'zustand'

interface UIState {
  showAddTransaction: boolean
  showMoodCheckin: boolean
  selectedDate: Date
  setShowAddTransaction: (show: boolean) => void
  setShowMoodCheckin: (show: boolean) => void
  setSelectedDate: (date: Date) => void
}

export const useUIStore = create<UIState>((set) => ({
  showAddTransaction: false,
  showMoodCheckin: false,
  selectedDate: new Date(),
  setShowAddTransaction: (show) => set({ showAddTransaction: show }),
  setShowMoodCheckin: (show) => set({ showMoodCheckin: show }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}))
