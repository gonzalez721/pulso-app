import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl?: string | null
  initials: string
  size?: number           // px, default 72
  onUpload: (dataUrl: string) => Promise<void>
}

/** Compress + resize image to a small data URL via canvas */
async function compressImage(file: File, maxPx = 256, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export function AvatarUpload({ currentUrl, initials, size = 72, onUpload }: AvatarUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const displayUrl = preview ?? currentUrl ?? null

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    setLoading(true)
    try {
      const compressed = await compressImage(file)
      setPreview(compressed)
      await onUpload(compressed)
    } catch (err) {
      console.error('[avatar] upload error', err)
    } finally {
      setLoading(false)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Avatar circle */}
      <div
        className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#7C4DFF,#4a00e0)' }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="foto" className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-extrabold text-white"
            style={{ fontSize: size * 0.33 }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Camera overlay button */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-90"
        style={{ background: '#A8FF3E', border: '2px solid #0A0A12' }}
        aria-label="Cambiar foto"
      >
        {loading
          ? <Loader2 size={13} className="text-[#0A0A12] animate-spin" />
          : <Camera size={13} className="text-[#0A0A12]" />
        }
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
