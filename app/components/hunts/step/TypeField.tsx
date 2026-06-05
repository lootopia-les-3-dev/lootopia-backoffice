import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Select } from "~/components/ui/Select"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, StepType } from "~/types/Hunt"

const ALL_TYPES: StepType[] = [
  "text", "image", "text-with-image", "qr-code", "nfc",
  "wait-input", "multi-directional", "geo", "ar", "go-to-step", "final",
]

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
  onTypeChange: (t: StepType) => void
  hasChildren: boolean
}

export const TypeField = ({ step, stepId, updateStep, onTypeChange, hasChildren }: Props) => {
  const [type, setType] = useState<StepType>(step.step.type)
  useEffect(() => setType(step.step.type), [step.step.type])

  const types = hasChildren ? ALL_TYPES.filter((t) => t !== "final") : ALL_TYPES

  return (
    <Field label="Type">
      <Select
        value={type}
        onChange={(e) => {
          const next = e.target.value as StepType
          setType(next)
          onTypeChange(next)
          updateStep({ stepId, type: next })
        }}
      >
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>
    </Field>
  )
}
