import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  fullScreen?: boolean
  hideClose?: boolean    // suppress X button and backdrop tap
}

export function Modal({ open, onClose, title, children, fullScreen, hideClose }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={hideClose ? undefined : onClose}
          />
          {/* Sheet */}
          <motion.div
            key="modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-surface-DEFAULT border-t border-border-light ${
              fullScreen ? 'top-0 rounded-none' : 'rounded-t-3xl max-h-[92vh]'
            } overflow-hidden flex flex-col`}
          >
            {/* Handle */}
            {!fullScreen && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border-light" />
              </div>
            )}
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                <h2 className="text-lg font-bold font-display text-white">{title}</h2>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-border-light transition-colors"
                  >
                    <X size={16} className="text-text-muted" />
                  </button>
                )}
              </div>
            )}
            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
