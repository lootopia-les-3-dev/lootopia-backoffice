import { useRef, useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Download } from "lucide-react"
import { generateStl } from "~/utils/stlExporter"
import { ColorPicker } from "./ColorPicker"

type QrMeshProps = {
  matrix: boolean[][]
  moduleSize: number
  baseHeight: number
  moduleHeight: number
  baseColor: string
  moduleColor: string
}

const QrMesh = ({ matrix, moduleSize, baseHeight, moduleHeight, baseColor, moduleColor }: QrMeshProps) => {
  const groupRef = useRef<THREE.Group>(null)

  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const totalW = cols * moduleSize
  const totalH = rows * moduleSize

  const { baseGeo, moduleGeo, modulePositions } = useMemo(() => {
    const baseGeo = new THREE.BoxGeometry(totalW, totalH, baseHeight)

    const positions: [number, number][] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c]) {
          const x = -totalW / 2 + c * moduleSize + moduleSize / 2
          const y = totalH / 2 - r * moduleSize - moduleSize / 2
          positions.push([x, y])
        }
      }
    }

    const moduleGeo = new THREE.BoxGeometry(moduleSize, moduleSize, moduleHeight)

    return { baseGeo, moduleGeo, modulePositions: positions }
  }, [matrix, moduleSize, baseHeight, moduleHeight, totalW, totalH, rows, cols])

  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: baseColor }), [baseColor])
  const modMat = useMemo(() => new THREE.MeshStandardMaterial({ color: moduleColor }), [moduleColor])

  const baseZ = 0
  const moduleZ = baseHeight / 2 + moduleHeight / 2

  return (
    <group ref={groupRef}>
      <mesh geometry={baseGeo} material={baseMat} position={[0, 0, baseZ]} />
      {modulePositions.map(([x, y], i) => (
        <mesh key={i} geometry={moduleGeo} material={modMat} position={[x, y, moduleZ]} />
      ))}
    </group>
  )
}

type Props = {
  matrix: boolean[][]
  moduleSize: number
  baseHeight: number
  moduleHeight: number
  baseColor: string
  moduleColor: string
  onBaseSizeChange: (v: number) => void
  onBaseHeightChange: (v: number) => void
  onModuleHeightChange: (v: number) => void
  onBaseColorChange: (c: string) => void
  onModuleColorChange: (c: string) => void
}

export const QrView3D = ({
  matrix,
  moduleSize,
  baseHeight,
  moduleHeight,
  baseColor,
  moduleColor,
  onBaseSizeChange,
  onBaseHeightChange,
  onModuleHeightChange,
  onBaseColorChange,
  onModuleColorChange,
}: Props) => {
  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSingle = () => {
    const { merged } = generateStl(matrix, { moduleSize, baseHeight, moduleHeight })
    download(merged, "qrcode.stl")
  }

  const exportBicolor = () => {
    const { base, modules } = generateStl(matrix, { moduleSize, baseHeight, moduleHeight })
    download(base, "qrcode_base.stl")
    download(modules, "qrcode_modules.stl")
  }

  const cols = matrix[0]?.length ?? 1
  const cameraZ = cols * moduleSize * 1.5

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      <div className="w-full max-w-xl h-80 rounded-xl overflow-hidden border border-mauve-400">
        <Canvas camera={{ position: [0, 0, cameraZ], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <directionalLight position={[-10, -5, 5]} intensity={0.3} />
          <Suspense fallback={null}>
            <QrMesh
              matrix={matrix}
              moduleSize={moduleSize}
              baseHeight={baseHeight}
              moduleHeight={moduleHeight}
              baseColor={baseColor}
              moduleColor={moduleColor}
            />
          </Suspense>
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-mauve-400">Taille module (mm)</span>
          <input
            type="range" min={0.5} max={3} step={0.1}
            value={moduleSize}
            onChange={(e) => onBaseSizeChange(parseFloat(e.target.value))}
            className="accent-mauve-900 dark:accent-mauve-50"
          />
          <span className="text-xs text-mauve-400">{moduleSize} mm</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-mauve-400">Hauteur base (mm)</span>
          <input
            type="range" min={0.5} max={5} step={0.2}
            value={baseHeight}
            onChange={(e) => onBaseHeightChange(parseFloat(e.target.value))}
            className="accent-mauve-900 dark:accent-mauve-50"
          />
          <span className="text-xs text-mauve-400">{baseHeight} mm</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-mauve-400">Hauteur modules (mm)</span>
          <input
            type="range" min={0.2} max={5} step={0.2}
            value={moduleHeight}
            onChange={(e) => onModuleHeightChange(parseFloat(e.target.value))}
            className="accent-mauve-900 dark:accent-mauve-50"
          />
          <span className="text-xs text-mauve-400">{moduleHeight} mm</span>
        </label>

        <div className="flex gap-4 items-end">
          <ColorPicker label="Couleur base" value={baseColor} onChange={onBaseColorChange} />
          <ColorPicker label="Couleur modules" value={moduleColor} onChange={onModuleColorChange} />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={exportSingle}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-700 transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          Exporter .stl
        </button>
        <button
          onClick={exportBicolor}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-700 transition-colors text-sm"
          title="Importe les 2 fichiers dans Bambu Studio / PrusaSlicer / Orca et assigne une couleur à chacun"
        >
          <Download className="h-4 w-4" />
          Exporter bicolore (2× .stl)
        </button>
      </div>
    </div>
  )
}
