import { useHuntManagerSafe, type FieldLockPayload } from "~/hooks/huntManagerHook"

export const fieldLockKey = (stepId: string, field: string) => `${stepId}:${field}`

type UseFieldLockResult = {
  isLocked: boolean
  lockedBy: { email: string; firstName: string; lastName: string } | null
  lock: () => void
  unlock: () => void
}

export const useFieldLock = (stepId: string, field: string): UseFieldLockResult => {
  const ctx = useHuntManagerSafe()

  const noop: UseFieldLockResult = { isLocked: false, lockedBy: null, lock: () => {}, unlock: () => {} }

  if (!ctx || !stepId || !field) return noop

  const lockEntry = ctx.fieldLocks.get(fieldLockKey(stepId, field)) ?? null
  const payload: FieldLockPayload = { stepId, field }

  return {
    isLocked: lockEntry !== null,
    lockedBy: lockEntry?.user ?? null,
    lock: () => ctx.lockField(payload),
    unlock: () => ctx.unlockField(payload),
  }
}
