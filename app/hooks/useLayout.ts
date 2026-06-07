import { useEffect, useRef } from "react"
import { useReactFlow, useStore, type Node, type Edge, type ReactFlowState } from "@xyflow/react"
import { timer } from "d3-timer"

const H_GAP = 120
const V_GAP = 100
const NODE_SIZE = 56
const DURATION = 300

const layoutNodes = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return []

  // build adjacency
  const children = new Map<string, string[]>()
  const parentCount = new Map<string, number>()
  nodes.forEach((n) => { children.set(n.id, []); parentCount.set(n.id, 0) })
  edges.forEach((e) => {
    children.get(e.source)?.push(e.target)
    parentCount.set(e.target, (parentCount.get(e.target) ?? 0) + 1)
  })

  const root = nodes.find((n) => parentCount.get(n.id) === 0)
  if (!root) return nodes

  // BFS to assign depth (rank) to each node
  const rank = new Map<string, number>()
  const queue: string[] = [root.id]
  rank.set(root.id, 0)
  while (queue.length) {
    const id = queue.shift()!
    for (const child of children.get(id) ?? []) {
      if (!rank.has(child)) {
        rank.set(child, rank.get(id)! + 1)
        queue.push(child)
      }
    }
  }

  // group nodes by rank
  const byRank = new Map<number, string[]>()
  rank.forEach((r, id) => {
    if (!byRank.has(r)) byRank.set(r, [])
    byRank.get(r)!.push(id)
  })

  // assign positions
  const positions = new Map<string, { x: number; y: number }>()
  byRank.forEach((ids, r) => {
    const totalWidth = ids.length * (NODE_SIZE + H_GAP) - H_GAP
    ids.forEach((id, i) => {
      positions.set(id, {
        x: i * (NODE_SIZE + H_GAP) - totalWidth / 2,
        y: r * (NODE_SIZE + V_GAP),
      })
    })
  })

  return nodes.map((n) => {
    const pos = positions.get(n.id)
    return pos ? { ...n, position: pos } : n
  })
}

const nodeCountSelector = (state: ReactFlowState) => state.nodeLookup.size

export const useLayout = (edges: Edge[]) => {
  const initial = useRef(true)
  const nodeCount = useStore(nodeCountSelector)
  const { getNodes, getNode, setNodes, fitView } = useReactFlow()

  useEffect(() => {
    const nodes = getNodes()
    const targetNodes = layoutNodes(nodes, edges)

    const transitions = targetNodes.map((node) => ({
      from: getNode(node.id)?.position ?? node.position,
      to: node.position,
      node,
    }))

    const t = timer((elapsed: number) => {
      const s = Math.min(elapsed / DURATION, 1)

      setNodes(
        transitions.map(({ node, from, to }) => ({
          ...node,
          position: {
            x: from.x + (to.x - from.x) * s,
            y: from.y + (to.y - from.y) * s,
          },
        }))
      )

      if (s >= 1) {
        setNodes(transitions.map(({ node, to }) => ({ ...node, position: to })))
        t.stop()
        fitView({ duration: 200, padding: 0.2 })
        initial.current = false
      }
    })

    return () => t.stop()
  }, [nodeCount, edges, getNodes, getNode, setNodes, fitView])
}
