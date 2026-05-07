import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-text-dark">{label}</label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-4 text-text-muted pointer-events-none">{prefix}</span>
          )}
          <input
            ref={ref}
            className={`
              w-full h-12 rounded-2xl border border-border-light bg-white px-4 text-text-dark
              placeholder:text-text-muted/60 font-medium
              focus:outline-none focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark
              disabled:opacity-50 disabled:bg-gray-50 transition-all
              ${prefix ? 'pl-10' : ''}
              ${suffix ? 'pr-10' : ''}
              ${error ? 'border-red-400 focus:ring-red-200' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 text-text-muted pointer-events-none">{suffix}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
