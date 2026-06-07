import { useEffect, useRef, useState, useCallback } from "react"

// ── helpers ──────────────────────────────────────────────────────────────────

const hexToHsv = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s, v]
}

const hsvToHex = (h: number, s: number, v: number): string => {
  h = h / 360
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r: number, g: number, b: number
  switch (i % 6) {
    case 0: [r, g, b] = [v, t, p]; break
    case 1: [r, g, b] = [q, v, p]; break
    case 2: [r, g, b] = [p, v, t]; break
    case 3: [r, g, b] = [p, q, v]; break
    case 4: [r, g, b] = [t, p, v]; break
    default: [r, g, b] = [v, p, q]
  }
  return "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")
}

const isValidHex = (s: string) => {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}

// ── SV square ────────────────────────────────────────────────────────────────

const SvSquare = ({
  hue, s, v, onChange,
}: { hue: number; s: number; v: number; onChange: (s: number, v: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const size = canvas.width

    // White → hue gradient (left → right)
    const hueHex = hsvToHex(hue, 1, 1)
    const gradH = ctx.createLinearGradient(0, 0, size, 0)
    gradH.addColorStop(0, "#ffffff")
    gradH.addColorStop(1, hueHex)
    ctx.fillStyle = gradH
    ctx.fillRect(0, 0, size, size)

    // Transparent → black gradient (top → bottom)
    const gradV = ctx.createLinearGradient(0, 0, 0, size)
    gradV.addColorStop(0, "rgba(0,0,0,0)")
    gradV.addColorStop(1, "rgba(0,0,0,1)")
    ctx.fillStyle = gradV
    ctx.fillRect(0, 0, size, size)
  }, [hue])

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!(e.buttons & 1)) return
      const rect = e.currentTarget.getBoundingClientRect()
      const newS = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newV = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
      onChange(newS, newV)
    },
    [onChange]
  )

  const cx = s * 160
  const cy = (1 - v) * 160

  return (
    <div className="relative w-40 h-40 rounded-lg overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        className="w-full h-full cursor-crosshair"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e) }}
        onPointerMove={handlePointer}
      />
      <div
        className="absolute w-3 h-3 rounded-full border-2 border-white shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ left: cx, top: cy, backgroundColor: hsvToHex(hue, s, v) }}
      />
    </div>
  )
}

// ── hue strip ────────────────────────────────────────────────────────────────

const HueStrip = ({ hue, onChange }: { hue: number; onChange: (h: number) => void }) => {
  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!(e.buttons & 1)) return
      const rect = e.currentTarget.getBoundingClientRect()
      const newH = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
      onChange(newH)
    },
    [onChange]
  )

  return (
    <div
      className="relative h-3 rounded-full cursor-pointer select-none"
      style={{
        background:
          "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
      }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e) }}
      onPointerMove={handlePointer}
    >
      <div
        className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow -translate-y-1/2 -translate-x-1/2 pointer-events-none"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: hsvToHex(hue, 1, 1) }}
      />
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

type Props = {
  label: string
  value: string
  onChange: (hex: string) => void
}

// Popover width in px — must match the w- class below
const POPOVER_W = 192

export const ColorPicker = ({ label, value, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const safeHex = isValidHex(value) ? value : "#000000"
  const [h, s, v] = hexToHsv(safeHex)

  useEffect(() => { setHexInput(value) }, [value])

  const handleOpen = () => {
    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setAlignRight(rect.left + POPOVER_W > window.innerWidth - 16)
    }
    setOpen((o) => !o)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const setHsv = (nh: number, ns: number, nv: number) => {
    const hex = hsvToHex(nh, ns, nv)
    onChange(hex)
    setHexInput(hex)
  }

  const handleHexInput = (raw: string) => {
    setHexInput(raw)
    const normalized = raw.startsWith("#") ? raw : "#" + raw
    if (isValidHex(normalized)) onChange(normalized)
  }

  return (
    <div className="flex flex-col gap-1 text-sm relative" ref={wrapperRef}>
      <span className="text-mauve-400">{label}</span>
      <button
        onClick={handleOpen}
        className="h-8 w-16 rounded border border-mauve-400 cursor-pointer shadow-inner"
        style={{ backgroundColor: safeHex }}
        aria-label={`Choisir ${label}`}
      />

      {open && (
        <div
          className={`absolute top-full mt-2 z-50 p-3 flex flex-col gap-3 rounded-xl border border-mauve-400 bg-mauve-50 dark:bg-mauve-900 shadow-xl`}
          style={{ width: POPOVER_W, ...(alignRight ? { right: 0 } : { left: 0 }) }}
        >
          <SvSquare
            hue={h} s={s} v={v}
            onChange={(ns, nv) => setHsv(h, ns, nv)}
          />
          <HueStrip hue={h} onChange={(nh) => setHsv(nh, s, v)} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-mauve-400 shrink-0" style={{ backgroundColor: safeHex }} />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              maxLength={7}
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent border border-mauve-400 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-mauve-900 dark:focus:border-mauve-50"
            />
          </div>
        </div>
      )}
    </div>
  )
}
