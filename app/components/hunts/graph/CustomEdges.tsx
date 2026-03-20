import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

export const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature: 10,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: 'oklch(54.2% 0.034 322.5)' }} />
    </>
  )
}