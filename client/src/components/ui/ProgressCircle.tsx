interface ProgressCircleProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  sublabel?: string
}

export function ProgressCircle({
  value,
  max,
  size = 160,
  strokeWidth = 12,
  className = '',
  label,
  sublabel,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const offset = circumference * (1 - pct)
  const isOver = value > max

  const trackColor = 'rgba(255,255,255,0.08)'
  const fillColor = isOver ? '#FF6B6B' : pct > 0.85 ? '#F59E0B' : '#A8FF3E'

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${fillColor}60)`,
          }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="text-2xl font-bold font-display text-white leading-none">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-xs text-text-muted mt-1 font-medium">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
