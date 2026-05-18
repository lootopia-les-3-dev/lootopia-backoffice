import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
  const [hovered, setHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, curvature: 0.25 })
  const onInsert = (data as Record<string, unknown>)?.onInsertStep as (() => void) | undefined

  if (!onInsert) return (
    <BaseEdge id={id} path={edgePath} style={{ stroke: 'oklch(54.2% 0.034 322.5)', strokeWidth: 1.5 }} />
  )

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: 'oklch(54.2% 0.034 322.5)', strokeWidth: 1.5 }}
      />
      {/* wider invisible hit area — must have pointerEvents: all to receive mouse events in SVG */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <EdgeLabelRenderer>
        <button
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
          className="absolute pointer-events-auto w-5 h-5 rounded-full bg-mauve-700 border border-mauve-500 flex items-center justify-center hover:border-violet-400 hover:bg-mauve-600 transition-colors nodrag nopan"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onInsert()}
        >
          <Plus className="w-3 h-3 text-mauve-300" />
        </button>
      </EdgeLabelRenderer>
    </>
  )
}