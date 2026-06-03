import { Box, QrCodeIcon } from "lucide-react"
import { lazy, Suspense, useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"
import { getQrMatrix } from "~/utils/qrMatrix"

const QrView2D = lazy(() =>
  import("~/components/qr/QrView2D").then((m) => ({ default: m.QrView2D }))
)
const QrView3D = lazy(() =>
  import("~/components/qr/QrView3D").then((m) => ({ default: m.QrView3D }))
)

type View = "2d" | "3d"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const QrCodeFields = ({ step, stepId, updateStep }: Props) => {

  const [code, setCode] = useState(step.step.code ?? "")
  const [matrix, setMatrix] = useState<boolean[][]>([])
  const [view, setView] = useState<View>("2d")

  // 2D options
  const [fgColor, setFgColor] = useState("#1a1a2e")
  const [bgColor, setBgColor] = useState("#ffffff")

  // 3D options
  const [moduleSize, setModuleSize] = useState(1.5)
  const [baseHeight, setBaseHeight] = useState(1.0)
  const [moduleHeight, setModuleHeight] = useState(0.8)
  const [baseColor3d, setBaseColor3d] = useState("#ffffff")
  const [moduleColor3d, setModuleColor3d] = useState("#1a1a2e")

  useEffect(() => { setCode(step.step.code ?? "") }, [step.step.code])

  const qrValue = code || ""

  useEffect(() => {
    if (!qrValue) return
    getQrMatrix(qrValue).then(setMatrix)
  }, [qrValue])

  return (
    <>
      <Field label="Code (laisser vide pour multidirectionnel)" stepId={stepId} field="code">
        <TextInput
          className="font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => { if (code !== (step.step.code ?? "")) updateStep({ stepId, code }) }}
          placeholder="ex: ABC123"
        />
      </Field>

      {qrValue && matrix.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-mauve-400 font-mono break-all">{qrValue}</p>

          <div className="flex rounded-lg overflow-hidden border border-mauve-400 w-fit">
            <button
              type="button"
              onClick={() => setView("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "2d"
                ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                : "hover:bg-mauve-200 dark:hover:bg-mauve-700"
                }`}
            >
              <QrCodeIcon className="h-4 w-4" /> 2D
            </button>
            <button
              type="button"
              onClick={() => setView("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "3d"
                ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                : "hover:bg-mauve-200 dark:hover:bg-mauve-700"
                }`}
            >
              <Box className="h-4 w-4" /> 3D
            </button>
          </div>

          <Suspense fallback={<div className="h-40 flex items-center justify-center text-mauve-400 text-sm">Chargement…</div>}>
            {view === "2d" ? (
              <QrView2D
                code={qrValue}
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
            )}
          </Suspense>
        </div>
      )}
    </>
  )
}
