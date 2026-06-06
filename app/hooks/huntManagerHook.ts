import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouteLoaderData } from "react-router"
import { io, type Socket } from "socket.io-client"
import { type rootLoader } from "~/loaders/rootloader"
import type { FieldLock, GeoCoordinate, GeoType, HuntState, InputType, MatchType, StepGame, StepType } from "~/types/Hunt"

type Status = "connecting" | "open" | "closed" | "error"

const tryParseJson = <T,>(val: unknown): T | undefined => {
  if (typeof val !== "string") return val as T | undefined
  try { return JSON.parse(val) as T } catch { return undefined }
}

const deserializeStep = (raw: HuntState["steps"][number]): HuntState["steps"][number] => ({
  ...raw,
  step: {
    ...raw.step,
    pointCoordinates: tryParseJson<GeoCoordinate>(raw.step.pointCoordinates),
    boundaryCoordinates: tryParseJson<GeoCoordinate[]>(raw.step.boundaryCoordinates),
    arPointCoordinates: tryParseJson<GeoCoordinate>(raw.step.arPointCoordinates),
    arBoundaryCoordinates: tryParseJson<GeoCoordinate[]>(raw.step.arBoundaryCoordinates),
  },
})

type StepCreatePayload = {
  previousStepId: string
  edge?: {
    matchType?: MatchType
    matchValue?: string
    regexPattern?: string
  }
}

type StepUpdatePayload = {
  stepId: string
  name?: string
  type?: StepType
  description?: string
  content?: string
  imageUrl?: string
  videoUrl?: string
  ValidationButtonText?: string
  code?: string
  inputType?: InputType
  placeholder?: string
  FinalMessage?: string
  FinalImageUrl?: string
  FinalVideoUrl?: string
  FinalButtonText?: string
  geoType?: GeoType
  boundaryCoordinates?: GeoCoordinate[]
  pointCoordinates?: GeoCoordinate
  radius?: number
  stepGame?: StepGame
  arGeoType?: GeoType | null
  arPointCoordinates?: GeoCoordinate | null
  arBoundaryCoordinates?: GeoCoordinate[] | null
  arRadius?: number | null
  mediaUrl?: string
  FinalMediaUrl?: string
  targetStepId?: string
}

type EdgeUpsertPayload = {
  fromStepId: string
  toStepId: string
  matchType: MatchType
  matchValue?: string
  regexPattern?: string
}

type EdgeDeletePayload = {
  fromStepId: string
  toStepId: string
}

export type FieldLockPayload = { stepId: string; field: string }

export type HuntManagerContextType = {
  status: Status
  huntState: HuntState | null
  socketRef: React.RefObject<Socket | null>
  fieldLocks: Map<string, FieldLock>
  createStep: (payload: StepCreatePayload) => void
  insertStep: (fromStepId: string, toStepId: string) => void
  updateStep: (payload: StepUpdatePayload) => void
  upsertEdge: (payload: EdgeUpsertPayload) => void
  deleteEdge: (payload: EdgeDeletePayload) => void
  lockField: (payload: FieldLockPayload) => void
  unlockField: (payload: FieldLockPayload) => void
}

export const fieldLockKey = (stepId: string, field: string) => `${stepId}:${field}`

export const HuntManagerContext = createContext<HuntManagerContextType | null>(null)

export const useHuntManager = () => {
  const ctx = useContext(HuntManagerContext)
  if (!ctx) throw new Error("useHuntManager must be used inside HuntManagerProvider")
  return ctx
}

export const useHuntManagerSafe = () => useContext(HuntManagerContext)

export const useHuntManagerInternal = (slug: string): HuntManagerContextType => {
  const { socketUrl, authToken } = useRouteLoaderData<typeof rootLoader>("root")!
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<Status>("connecting")
  const [huntState, setHuntState] = useState<HuntState | null>(null)
  const [fieldLocks, setFieldLocks] = useState<Map<string, FieldLock>>(new Map())
  const pendingInsert = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    console.log("[socket] init — socketUrl:", socketUrl, "| slug:", slug, "| authToken:", authToken ? `${authToken.slice(0, 10)}…` : "NULL ⚠️")

    const socket = io(socketUrl, {
      path: "/ws/hunts/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      query: { slug },
      auth: authToken ? { token: authToken } : {},
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("[socket] ✅ connected — id:", socket.id)
      setStatus("open")
    })
    socket.on("disconnect", (reason) => {
      console.warn("[socket] ❌ disconnected — reason:", reason)
      setStatus("closed")
    })
    socket.on("connect_error", (err) => {
      console.error("[socket] ❌ connect_error — message:", err.message, "| full error:", err)
      setStatus("error")
    })

    socket.io.on("reconnect_attempt", (n) => {
      console.log(`[socket] reconnect attempt #${n}`)
    })
    socket.io.on("reconnect_failed", () => {
      console.error("[socket] reconnect failed — giving up")
    })

    socket.onAny((event, ...args) => {
      console.log("[socket] ← event:", event, args)
    })
    socket.onAnyOutgoing((event, ...args) => {
      console.log("[socket] → emit:", event, args)
    })

    socket.on("hunt:state", (state: HuntState) => {
      console.log("[socket] hunt:state received — steps:", state.steps.length)
      setHuntState({ ...state, steps: state.steps.map(deserializeStep) })
    })

    socket.on("hunt:error", (err: { field?: string; message: string }) => {
      console.error("[socket] hunt:error", err)
    })

    socket.on("step:created", (raw: HuntState["steps"][number]) => {
      const step = deserializeStep(raw)
      setHuntState((prev) => prev ? { ...prev, steps: [...prev.steps, step] } : prev)

      for (const [fromStepId, toStepId] of pendingInsert.current.entries()) {
        pendingInsert.current.delete(fromStepId)
        socketRef.current?.emit("edge:upsert", { fromStepId: step.id, toStepId, matchType: "default" })
        socketRef.current?.emit("edge:delete", { fromStepId, toStepId })
        break
      }
    })

    socket.on("step:updated", (raw: HuntState["steps"][number]) => {
      const step = deserializeStep(raw)
      setHuntState((prev) => {
        if (!prev) return prev
        return { ...prev, steps: prev.steps.map((s) => s.id === step.id ? step : s) }
      })
    })

    socket.on("edge:upserted", (edge: { fromStepId: string; toStepId: string; matchType: MatchType; matchValue?: string; regexPattern?: string }) => {
      setHuntState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          steps: prev.steps.map((s) => {
            if (s.id !== edge.fromStepId) return s
            const existing = s.followedBy.findIndex((f) => f.nextStepId === edge.toStepId)
            const newEdge = { nextStepId: edge.toStepId, matchType: edge.matchType, matchValue: edge.matchValue ?? null, regexPattern: edge.regexPattern ?? null }
            const followedBy = existing >= 0
              ? s.followedBy.map((f, i) => i === existing ? newEdge : f)
              : [...s.followedBy, newEdge]
            return { ...s, followedBy }
          }),
        }
      })
    })

    socket.on("edge:deleted", ({ fromStepId, toStepId }: { fromStepId: string; toStepId: string }) => {
      setHuntState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === fromStepId
              ? { ...s, followedBy: s.followedBy.filter((f) => f.nextStepId !== toStepId) }
              : s
          ),
        }
      })
    })

    socket.on("field:locked", (lock: FieldLock) => {
      setFieldLocks((prev) => {
        const next = new Map(prev)
        next.set(fieldLockKey(lock.stepId, lock.field), lock)
        return next
      })
    })

    socket.on("field:unlocked", ({ stepId, field }: { stepId: string; field: string }) => {
      setFieldLocks((prev) => {
        const next = new Map(prev)
        next.delete(fieldLockKey(stepId, field))
        return next
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [socketUrl, slug, authToken])

  const emit = useCallback((event: string, data: unknown) => {
    if (!socketRef.current) {
      console.warn(`[socket] emit "${event}" — socket is null, event dropped`)
      return
    }
    if (!socketRef.current.connected) {
      console.warn(`[socket] emit "${event}" — socket not connected, event dropped`)
    }
    socketRef.current.emit(event, data)
  }, [])

  const createStep = useCallback((payload: StepCreatePayload) => emit("step:create", payload), [emit])
  const updateStep = useCallback((payload: StepUpdatePayload) => emit("step:update", payload), [emit])
  const upsertEdge = useCallback((payload: EdgeUpsertPayload) => emit("edge:upsert", payload), [emit])
  const deleteEdge = useCallback((payload: EdgeDeletePayload) => emit("edge:delete", payload), [emit])
  const lockField = useCallback((payload: FieldLockPayload) => emit("field:lock", payload), [emit])
  const unlockField = useCallback((payload: FieldLockPayload) => emit("field:unlock", payload), [emit])
  const insertStep = useCallback((fromStepId: string, toStepId: string) => {
    pendingInsert.current.set(fromStepId, toStepId)
    emit("step:create", { previousStepId: fromStepId })
  }, [emit])

  return { status, huntState, socketRef, fieldLocks, createStep, insertStep, updateStep, upsertEdge, deleteEdge, lockField, unlockField }
}
