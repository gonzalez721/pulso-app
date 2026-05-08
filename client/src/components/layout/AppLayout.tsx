import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { AddTransactionModal } from '../AddTransactionModal'
import { useUIStore } from '../../store/uiStore'

export function AppLayout() {
  const { showAddTransaction, setShowAddTransaction } = useUIStore()

  return (
    <div className="min-h-screen bg-[#0A0A12] max-w-lg mx-auto relative">
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
      <AddTransactionModal
        open={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
      />
    </div>
  )
}
