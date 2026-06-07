import { useEffect, useState, lazy, Suspense } from "react"
import { useNavigate, useSearchParams } from "react-router"
import type { LoaderFunction } from "react-router"
import { QrCodeIcon, Box } from "lucide-react"
import { getQrMatrix } from "~/utils/qrMatrix"

const QrView2D = lazy(() =>
  import("~/components/qr/QrView2D").then((m) => ({ default: m.QrView2D }))
)
const QrView3D = lazy(() =>
  import("~/components/qr/QrView3D").then((m) => ({ default: m.QrView3D }))
)

type View = "2d" | "3d"

type LoaderData = {
  view: View
  code: string | null
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const view = (url.searchParams.get("view") as View) ?? "2d"
  return { view, code } satisfies LoaderData
}

const QrCodeTool = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const view = (searchParams.get("view") as View) ?? "2d"
  const code = searchParams.get("code") ?? ""

  const [inputCode, setInputCode] = useState(code)
  const [matrix, setMatrix] = useState<boolean[][]>([])

  // 2D options
  const [fgColor, setFgColor] = useState("#1a1a2e")
  const [bgColor, setBgColor] = useState("#ffffff")

  // 3D options
  const [moduleSize, setModuleSize] = useState(1.5)
  const [baseHeight, setBaseHeight] = useState(1.0)
  const [moduleHeight, setModuleHeight] = useState(0.8)
  const [baseColor3d, setBaseColor3d] = useState("#ffffff")
  const [moduleColor3d, setModuleColor3d] = useState("#1a1a2e")

  const setView = (v: View) => {
    const params = new URLSearchParams(searchParams)
    params.set("view", v)
    navigate(`?${params.toString()}`, { replace: true })
  }

  const setCodeParam = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val) params.set("code", val)
    else params.delete("code")
    navigate(`?${params.toString()}`, { replace: true })
  }

  useEffect(() => {
    const current = searchParams.get("code") ?? ""
    setInputCode(current)
  }, [searchParams])

  useEffect(() => {
    const target = inputCode || "https://lootopia.fr"
    getQrMatrix(target).then(setMatrix)
  }, [inputCode])

  const handleCodeChange = (val: string) => {
    setInputCode(val)
    setCodeParam(val)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Générateur QR Code</h1>

        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg overflow-hidden border border-mauve-400">
            <button
              onClick={() => setView("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "2d"
                  ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                  : "hover:bg-mauve-200 dark:hover:bg-mauve-700"
              }`}
            >
              <QrCodeIcon className="h-4 w-4" />
              2D
            </button>
            <button
              onClick={() => setView("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "3d"
                  ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                  : "hover:bg-mauve-200 dark:hover:bg-mauve-700"
              }`}
            >
              <Box className="h-4 w-4" />
              3D
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-mauve-400">URL ou texte</label>
        <input
          type="text"
          value={inputCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="https://lootopia.fr"
          className="w-full px-3 py-2 rounded-lg border border-mauve-400 bg-transparent focus:outline-none focus:border-mauve-900 dark:focus:border-mauve-50 transition-colors text-sm"
        />
      </div>

      <Suspense fallback={<div className="h-80 flex items-center justify-center text-mauve-400 text-sm">Chargement…</div>}>
        {matrix.length > 0 && (
          view === "2d" ? (
            <QrView2D
              code={inputCode || "https://lootopia.fr"}
              fgColor={fgColor}
              bgColor={bgColor}
              onFgColorChange={setFgColor}
              onBgColorChange={setBgColor}
            />
          ) : (
            <QrView3D
              matrix={matrix}
              moduleSize={moduleSize}
              baseHeight={baseHeight}
              moduleHeight={moduleHeight}
              baseColor={baseColor3d}
              moduleColor={moduleColor3d}
              onBaseSizeChange={setModuleSize}
              onBaseHeightChange={setBaseHeight}
              onModuleHeightChange={setModuleHeight}
              onBaseColorChange={setBaseColor3d}
              onModuleColorChange={setModuleColor3d}
            />
          )
        )}
      </Suspense>
    </div>
  )
}

export default QrCodeTool
