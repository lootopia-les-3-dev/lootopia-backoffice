import { Field } from "~/components/ui/Field"
import { Select } from "~/components/ui/Select"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, StepGame } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const ArFields = ({ step, stepId, updateStep }: Props) => {
  return (
    <Field label="Mini-jeu AR" stepId={stepId} field="stepGame">
      <Select
        value={step.step.stepGame ?? "collect"}
        onChange={(e) => updateStep({ stepId, stepGame: e.target.value as StepGame })}
      >
        <option value="collect">collect</option>
        <option value="dig">dig</option>
      </Select>
    </Field>
  )
}
