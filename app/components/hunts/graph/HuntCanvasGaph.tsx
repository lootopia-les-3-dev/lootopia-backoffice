import dagre from "@dagrejs/dagre"
import { Background, BackgroundVariant, Controls, type Connection, type Edge, type Node, ReactFlow, useReactFlow } from "@xyflow/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { CustomEdge } from "~/components/hunts/graph/CustomEdges"
import { CustomNode, CustomStart, MultiDirectionalNode, PlaceholderNode } from "~/components/hunts/graph/CustomNodes"
import { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntState } from "~/types/Hunt"

const NODE_WIDTH = 80
const NODE_HEIGHT = 56
const PLACEHOLDER_SUFFIX = "__placeholder"

const nodesTypes = {
  start: CustomStart,
  placeholder: PlaceholderNode,
  custom: CustomNode,
  "multi-directional": MultiDirectionalNode,
}

const edgesTypes = {
  custom: CustomEdge,
}

const getBackEdgeIds = (huntState: HuntState): Set<string> => {
  const visited = new Set<string>()
  const inStack = new Set<string>()
  const backEdgeIds = new Set<string>()

  const dfs = (nodeId: string) => {
    visited.add(nodeId)
    inStack.add(nodeId)
    const step = huntState.steps.find((s) => s.id === nodeId)
    if (!step) return
    for (const follow of step.followedBy) {
      const edgeId = `${nodeId}-${follow.nextStepId}`
      if (!visited.has(follow.nextStepId)) {
        dfs(follow.nextStepId)
      } else if (inStack.has(follow.nextStepId)) {
        backEdgeIds.add(edgeId)
      }
    }
    inStack.delete(nodeId)
  }

  for (const step of huntState.steps) {
    if (!visited.has(step.id)) dfs(step.id)
  }
  return backEdgeIds
}

const computeLayout = (
  huntState: HuntState,
  onCreateStep: (previousStepId: string, handleId?: string) => void,
  onInsertStep: (fromStepId: string, toStepId: string) => void,
  activeStepId: string | undefined,
): { nodes: Node[]; edges: Edge[] } => {
  const backEdgeIds = getBackEdgeIds(huntState)
  const leafIds = huntState.steps
    .filter((s) => s.step.type !== "final" && s.step.type !== "multi-directional" && s.followedBy.filter((f) => !backEdgeIds.has(`${s.id}-${f.nextStepId}`)).length === 0)
    .map((s) => s.id)

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const step of huntState.steps) {
    g.setNode(step.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const leafId of leafIds) {
    const placeholderId = `${leafId}${PLACEHOLDER_SUFFIX}`
    g.setNode(placeholderId, { width: NODE_WIDTH, height: NODE_HEIGHT })
    g.setEdge(leafId, placeholderId)
  }

  for (const step of huntState.steps) {
    for (const follow of step.followedBy) {
      const edgeId = `${step.id}-${follow.nextStepId}`
      if (!backEdgeIds.has(edgeId)) {
        g.setEdge(step.id, follow.nextStepId)
      }
    }
  }

  dagre.layout(g)

  // for multi-directional nodes, reorder followedBy to match the left→right
  // order that dagre assigned to the children, so handle[i] aligns with child[i]
  const orderedFollowedBy = new Map<string, typeof huntState.steps[number]["followedBy"]>()
  for (const step of huntState.steps) {
    if (step.step.type !== "multi-directional") continue
    const sorted = [...step.followedBy].sort((a, b) => {
      const ax = g.node(a.nextStepId)?.x ?? 0
      const bx = g.node(b.nextStepId)?.x ?? 0
      return ax - bx
    })
    orderedFollowedBy.set(step.id, sorted)
  }

  const nodes: Node[] = huntState.steps.map((step) => {
    const { x, y } = g.node(step.id)
    const isMulti = step.step.type === "multi-directional"
    return {
      id: step.id,
      type: isMulti ? "multi-directional" : step.step.type === "start" ? "start" : "custom",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: {
        label: step.step.name,
        stepType: step.step.type,
        id: step.id,
        followedBy: orderedFollowedBy.get(step.id) ?? step.followedBy,
        onAddHandle: () => onCreateStep(step.id, "src-new"),
        isActive: step.id === activeStepId,
      },
    }
  })

  for (const leafId of leafIds) {
    const placeholderId = `${leafId}${PLACEHOLDER_SUFFIX}`
    const { x, y } = g.node(placeholderId)
    nodes.push({
      id: placeholderId,
      type: "placeholder",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { onAdd: () => onCreateStep(leafId) },
    })
  }

  const edges: Edge[] = []
  for (const step of huntState.steps) {
    const isMulti = step.step.type === "multi-directional"
    for (const follow of step.followedBy) {
      const edgeId = `${step.id}-${follow.nextStepId}`
      edges.push({
        id: edgeId,
        source: step.id,
        ...(isMulti ? { sourceHandle: `src-${follow.nextStepId}` } : {}),
        target: follow.nextStepId,
        type: "custom",
        animated: backEdgeIds.has(edgeId),
        data: { isBackEdge: backEdgeIds.has(edgeId), isMultiSource: isMulti, matchType: follow.matchType, matchValue: follow.matchValue, regexPattern: follow.regexPattern, onInsertStep: () => onInsertStep(step.id, follow.nextStepId) },
      })
    }
  }

  for (const leafId of leafIds) {
    const placeholderId = `${leafId}${PLACEHOLDER_SUFFIX}`
    edges.push({
      id: `${leafId}-${placeholderId}`,
      source: leafId,
      target: placeholderId,
      targetHandle: "target",
      type: "custom",
      data: {},
    })
  }

  return { nodes, edges }
}

const FitAfterLayout = ({ trigger }: { trigger: number }) => {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (trigger > 0) fitView({ duration: 300, padding: 0.2 })
  }, [trigger, fitView])
  return null
}

export const HuntCanvasGaph = () => {
  const { huntState, createStep, insertStep, upsertEdge, deleteEdge } = useHuntManager()
  const { stepId: activeStepId } = useParams()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [layoutVersion, setLayoutVersion] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const connectingFrom = useRef<{ nodeId: string; handleId: string | null } | null>(null)

  useEffect(() => {
    if (!huntState) return
    const { nodes: newNodes, edges: newEdges } = computeLayout(
      huntState,
      (previousStepId) => createStep({ previousStepId }),
      (fromStepId, toStepId) => insertStep(fromStepId, toStepId),
      activeStepId,
    )
    setNodes(newNodes)
    setEdges(newEdges)
    setLayoutVersion((v) => v + 1)
  }, [huntState, createStep, insertStep, deleteEdge, activeStepId])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // drag landed on an existing node → create / update edge
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    const sourceStep = huntState?.steps.find((s) => s.id === connection.source)
    if (!sourceStep) return
    upsertEdge({
      fromStepId: connection.source,
      toStepId: connection.target,
      matchType: "default",
    })
  }, [huntState, upsertEdge])

  // drag released on empty canvas → create a new step
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const from = connectingFrom.current
    if (!from) return
    const target = event.target as Element
    // if the drag ended on a pane (not a node), create a new step
    if (target.classList.contains("react-flow__pane")) {
      createStep({ previousStepId: from.nodeId })
    }
    connectingFrom.current = null
  }, [createStep])

  return (
    <div className="h-full w-full">
      <ReactFlow
        className="text-transparent"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodesTypes}
        edgeTypes={edgesTypes}
        onConnectStart={(_, params) => {
          connectingFrom.current = { nodeId: params.nodeId ?? "", handleId: params.handleId ?? null }
        }}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        fitView
      >
        <Background
          id="1"
          gap={150}
          size={20}
          color={isDarkMode ? "#f1f1f170" : "#2a212c70"}
          variant={BackgroundVariant.Cross}
        />
        <Controls className="text-mauve-50" />
        <FitAfterLayout trigger={layoutVersion} />
      </ReactFlow>
    </div>
  )
}
