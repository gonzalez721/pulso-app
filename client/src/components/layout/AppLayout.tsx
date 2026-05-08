import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { AddTransactionModal } from '../AddTransactionModal'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { MailWarning, X, ShieldCheck } from 'lucide-react'

export function AppLayout() {
  const { showAddTransaction, setShowAddTransaction } = useUIStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const showBanner = !dismissed && user && user.emailVerified === false

  return (
    <div className="min-h-screen bg-[#0A0A12] max-w-lg mx-auto relative">
      {showBanner && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2.5 flex items-center gap-3">
          <MailWarning size={15} className="text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-300 flex-1">
            Verifica tu correo para activar tu cuenta.
          </p>
          <button
            onClick={() => navigate(`/verify-code?email=${encodeURIComponent(user?.email ?? '')}`)}
            className="text-xs font-bold text-yellow-400 underline flex-shrink-0 flex items-center gap-1 hover:text-yellow-300 transition-colors"
          >
            <ShieldCheck size={11} />
            Verificar
          </button>
          <button onClick={() => setDismissed(true)} className="text-yellow-500/60 hover:text-yellow-400 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}
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
