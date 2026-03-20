import { Background, BackgroundVariant, Controls, type Edge, type Node, ReactFlow } from "@xyflow/react"
import { useEffect, useState } from "react"
import { CustomEdge } from "~/components/hunts/graph/CustomEdges"
import { CustomNode, CustomStart, PlaceholderNode } from "~/components/hunts/graph/CustomNodes"

const initialNodes: Node[] = [
  {
    id: 'n1',
    type: 'start',
    position: { x: 71, y: -30 },
    data: { label: 'Node 1' },
  },
  {
    id: 'n2',
    type: 'custom',
    position: { x: 71, y: 100 },
    data: { label: 'Node 2' },
  },
  {
    id: 'n3',
    type: 'placeholder',
    position: { x: 71, y: 200 },
    data: { label: 'Node 3' },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'n1',
    target: 'n2',
    type: 'custom',
  },
  {
    id: 'e2-3',
    source: 'n2',
    target: 'n3',
    type: 'custom',
    animated: true,
  },
]

const nodesTypes = {
  start: CustomStart,
  custom: CustomNode,
  placeholder: PlaceholderNode,
}

const edgesTypes = {
  custom: CustomEdge,
}

export const HuntCanvasGaph = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return <div className="h-full w-full">
    <ReactFlow
      className="text-transparent"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodesTypes}
      edgeTypes={edgesTypes}
      fitView>
      <Background
        id="1"
        gap={150}
        size={20}
        color={isDarkMode ? "#f1f1f170" : "#2a212c70"}
        variant={BackgroundVariant.Cross}
      />
      < Controls className="text-mauve-50" />
    </ReactFlow>
  </div>
}
