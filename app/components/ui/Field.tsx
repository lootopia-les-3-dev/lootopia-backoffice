import clsx from "clsx"
import { useRef } from "react"
import { Label } from "~/components/ui/Label"
import { useFieldLock } from "~/hooks/useFieldLock"

type Props = {
  label: string
  children: React.ReactNode
  stepId?: string
  field?: string
  className?: string
}

export const Field = ({ label, children, stepId = "", field = "", className }: Props) => {
  const { isLocked, lock, unlock } = useFieldLock(stepId, field)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFocus = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    lock()
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      blurTimer.current = null
      unlock()
    }, 100)
  }

  return (
    <div
      className={clsx("flex flex-col gap-1 transition-opacity", isLocked && "opacity-50 pointer-events-none", className)}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <Label>{label}</Label>
      {children}
    </div>
  )
}
