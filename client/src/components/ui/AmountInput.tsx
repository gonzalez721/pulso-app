import { useState, useRef, useEffect } from 'react'
import { formatCurrency } from '../../lib/utils'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  placeholder?: string
  currency?: string
}

export function AmountInput({
  value,
  onChange,
  label,
  placeholder = '0',
  currency = 'MXN',
}: AmountInputProps) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState(value > 0 ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!focused && value > 0) setRaw(String(value))
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : v
    setRaw(cleaned)
    const num = parseFloat(cleaned)
    onChange(isNaN(num) ? 0 : num)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-text-dark">{label}</label>}
      <div
        className={`
          relative flex items-center h-16 rounded-2xl border bg-white transition-all cursor-text
          ${focused ? 'border-primary-dark ring-2 ring-primary-dark/20' : 'border-border-light'}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        <span className="absolute left-4 text-xl font-bold text-text-muted pointer-events-none">
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={focused ? raw : value > 0 ? String(value) : ''}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full h-full bg-transparent pl-8 pr-4 text-2xl font-bold text-primary-dark focus:outline-none placeholder:text-text-muted/40"
        />
        <span className="absolute right-4 text-sm font-semibold text-text-muted pointer-events-none">
          {currency}
        </span>
      </div>
      {!focused && value > 0 && (
        <p className="text-xs text-text-muted">{formatCurrency(value, currency)}</p>
      )}
    </div>
  )
}
