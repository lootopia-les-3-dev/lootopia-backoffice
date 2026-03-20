import { Handle, type NodeProps, Position } from "@xyflow/react"
import { Plus } from "lucide-react"
import type { CSSProperties } from "react"

const HandlesStyle: CSSProperties = {
  background: "oklch(54.2% 0.034 322.5)",
  border: "none"
}

export const CustomNode = ({ id }: NodeProps) => {
  return (
    <>
      <div className="p-4 bg-mauve-700 rounded-full border border-mauve-500 h-14 w-14 flex items-center justify-center hover:cursor-pointer">
        <p className="text-mauve-50">
          {id}
        </p>
      </div>
      <Handle type="target" position={Position.Top} isConnectable={false} style={HandlesStyle} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={HandlesStyle} />
    </>
  )
}

export const CustomStart = () => {
  return (
    <>
      <div className="p-4 bg-mauve-700 rounded-full border border-mauve-500 h-14 w-14 flex items-center justify-center hover:cursor-not-allowed outline-amber-800">
        <p className="text-mauve-50">
          Start
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={HandlesStyle} />
    </>
  )
}

export const PlaceholderNode = () => {
  return (<>
    <div className="p-4 rounded-full border border-mauve-500 border-dashed h-14 w-14 flex items-center justify-center hover:cursor-pointer">
      <p className="text-mauve-500">
        <Plus />
      </p>
    </div>
    <Handle type="target" position={Position.Top} isConnectable={false} style={{ ...HandlesStyle, background: "transparent", border: "1px solid oklch(54.2% 0.034 322.5)" }} />
  </>
  )
}