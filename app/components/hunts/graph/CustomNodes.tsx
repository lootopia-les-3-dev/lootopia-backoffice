import { Handle, type NodeProps, Position } from "@xyflow/react"
import { GitBranch, Image, Joystick, KeyRound, MapPin, MessageSquare, Plus, QrCode, ScanLine, Star, TextSelect } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router"
import type { StepFollowedBy } from "~/types/Hunt"

const HANDLE_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  background: "oklch(54.2% 0.034 322.5)",
  border: "2px solid oklch(35% 0.02 322.5)",
}

const HANDLE_SOURCE_CONNECTABLE: CSSProperties = {
  ...HANDLE_STYLE,
  background: "oklch(65% 0.15 290)",
  border: "2px solid oklch(45% 0.1 290)",
  cursor: "crosshair",
}

const stepIcon: Record<string, ReactNode> = {
  start: <Star className="w-4 h-4" />,
  text: <MessageSquare className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  "text-with-image": <TextSelect className="w-4 h-4" />,
  "qr-code": <QrCode className="w-4 h-4" />,
  "wait-input": <KeyRound className="w-4 h-4" />,
  "multi-directional": <GitBranch className="w-4 h-4" />,
  geo: <MapPin className="w-4 h-4" />,
  ar: <Joystick className="w-4 h-4" />,
  final: <ScanLine className="w-4 h-4" />,
}

const stepLabel: Record<string, string> = {
  start: "Départ",
  text: "Texte",
  image: "Image",
  "text-with-image": "Texte + Image",
  "qr-code": "QR Code",
  "wait-input": "Saisie",
  "multi-directional": "Branchement",
  geo: "Géo",
  ar: "AR",
  final: "Fin",
}

type BaseNodeProps = {
  id: string
  stepType: string
  isActive: boolean
  children?: ReactNode
  className?: string
  href?: string
}

const NodeShell = ({ stepType, isActive, children, href }: BaseNodeProps) => {
  const activeRing = isActive
    ? "ring-2 ring-offset-2 ring-offset-mauve-900 ring-violet-400"
    : ""

  const inner = (
    <div className={`
      flex flex-col items-center justify-center gap-1
      bg-mauve-800 border border-mauve-600
      rounded-2xl w-20 py-2.5
      hover:border-mauve-400 transition-colors
      ${activeRing}
    `}>
      <span className="text-mauve-300">{stepIcon[stepType] ?? <MessageSquare className="w-4 h-4" />}</span>
      <span className="text-mauve-100 text-[10px] font-medium leading-none whitespace-nowrap">
        {stepLabel[stepType] ?? stepType}
      </span>
      {children}
    </div>
  )

  if (href) return <Link to={href} className="block nodrag">{inner}</Link>
  return inner
}

export const CustomNode = ({ data }: NodeProps) => {
  const stepType = data.stepType as string
  const isActive = data.isActive as boolean
  const isFinal = stepType === "final"
  return (
    <>
      <NodeShell id={data.id as string} stepType={stepType} isActive={isActive} href={`${data.id}`} />
      <Handle type="target" position={Position.Top} isConnectable={false} style={HANDLE_STYLE} />
      {!isFinal && <Handle type="source" position={Position.Bottom} isConnectable={false} style={HANDLE_STYLE} />}
    </>
  )
}

export const CustomStart = ({ data }: NodeProps) => {
  const isActive = data.isActive as boolean
  return (
    <>
      <NodeShell id={data.id as string} stepType="start" isActive={isActive}>
        <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider">start</span>
      </NodeShell>
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={HANDLE_STYLE} />
    </>
  )
}

export const PlaceholderNode = ({ data }: NodeProps) => {
  return (
    <>
      <button
        className="flex items-center justify-center w-20 h-10 rounded-xl border border-dashed border-mauve-600 hover:border-mauve-400 hover:bg-mauve-800 transition-colors"
        onClick={() => (data.onAdd as (() => void))?.()}
      >
        <Plus className="w-4 h-4 text-mauve-500" />
      </button>
      <Handle
        type="target"
        id="target"
        position={Position.Top}
        isConnectable={false}
        style={{ ...HANDLE_STYLE, background: "transparent", border: "2px dashed oklch(54.2% 0.034 322.5)" }}
      />
    </>
  )
}

export const MultiDirectionalNode = ({ data }: NodeProps) => {
  const followedBy = (data.followedBy as StepFollowedBy[]) ?? []
  const onAddHandle = data.onAddHandle as (() => void) | undefined
  const isActive = data.isActive as boolean

  const activeRing = isActive
    ? "ring-2 ring-offset-2 ring-offset-mauve-900 ring-violet-400"
    : ""

  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} style={HANDLE_STYLE} />

      <Link to={`${data.id}`} className="block nodrag">
        <div className={`
          flex flex-col items-center justify-center gap-1
          bg-mauve-800 border border-mauve-600
          rounded-2xl w-20 py-2.5
          hover:border-violet-500 transition-colors
          ${activeRing}
        `}>
          <span className="text-violet-400"><GitBranch className="w-4 h-4" /></span>
          <span className="text-mauve-100 text-[10px] font-medium leading-none">Branchement</span>
          <span className="text-violet-400 text-[9px]">{followedBy.length} sortie{followedBy.length !== 1 ? "s" : ""}</span>
        </div>
      </Link>

      {/* one draggable source handle per outgoing edge */}
      {followedBy.map((f, i) => {
        const total = followedBy.length
        const offsetPct = total === 1 ? 50 : 10 + (80 / (total - 1)) * i
        return (
          <Handle
            key={f.nextStepId}
            id={`src-${f.nextStepId}`}
            type="source"
            position={Position.Bottom}
            isConnectable={true}
            style={{ ...HANDLE_SOURCE_CONNECTABLE, left: `${offsetPct}%`, transform: "translateX(-50%)" }}
          />
        )
      })}

      {/* drag-to-create new branch handle */}
      <Handle
        id="src-new"
        type="source"
        position={Position.Right}
        isConnectable={true}
        style={{ ...HANDLE_SOURCE_CONNECTABLE, top: "50%", right: -4, transform: "translateY(-50%)" }}
      />

      {/* + button */}
      <button
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-mauve-700 border border-mauve-500 flex items-center justify-center hover:border-violet-400 hover:bg-mauve-600 transition-colors"
        onClick={(e) => { e.stopPropagation(); onAddHandle?.() }}
        title="Ajouter une sortie"
      >
        <Plus className="w-3 h-3 text-mauve-300" />
      </button>
    </>
  )
}
