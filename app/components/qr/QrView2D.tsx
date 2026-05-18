import { useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import jsPDF from "jspdf"
import { Download } from "lucide-react"
import { ColorPicker } from "./ColorPicker"

type Props = {
  code: string
  fgColor: string
  bgColor: string
  onFgColorChange: (c: string) => void
  onBgColorChange: (c: string) => void
}

type ExportFormat = "png" | "jpeg" | "pdf"

export const QrView2D = ({ code, fgColor, bgColor, onFgColorChange, onBgColorChange }: Props) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [format, setFormat] = useState<ExportFormat>("png")

  const getCanvas = (): HTMLCanvasElement | null => {
    return canvasRef.current?.querySelector("canvas") ?? null
  }

  const exportQr = () => {
    const canvas = getCanvas()
    if (!canvas) return

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const size = 100
      const x = (210 - size) / 2
      const y = (297 - size) / 2
      pdf.addImage(imgData, "PNG", x, y, size, size)
      pdf.save("qrcode.pdf")
      return
    }

    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png"
    const ext = format === "jpeg" ? "jpg" : "png"
    const dataUrl = canvas.toDataURL(mimeType, 0.95)
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `qrcode.${ext}`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6 items-center">
      <div ref={canvasRef} className="p-4 rounded-xl" style={{ backgroundColor: bgColor }}>
        <QRCodeCanvas
          value={code || "https://lootopia.fr"}
          size={260}
          fgColor={fgColor}
          bgColor={bgColor}
          level="H"
          marginSize={1}
        />
      </div>

      <div className="flex gap-6 items-center">
        <ColorPicker label="Couleur QR" value={fgColor} onChange={onFgColorChange} />
        <ColorPicker label="Fond" value={bgColor} onChange={onBgColorChange} />
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex rounded-lg overflow-hidden border border-mauve-400">
          {(["png", "jpeg", "pdf"] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 text-sm uppercase transition-colors ${
                format === f
                  ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                  : "hover:bg-mauve-200 dark:hover:bg-mauve-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={exportQr}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-700 transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          Exporter
        </button>
      </div>
    </div>
  )
}
