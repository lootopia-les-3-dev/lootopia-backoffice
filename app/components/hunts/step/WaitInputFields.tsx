import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Select } from "~/components/ui/Select"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, InputType } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

const INPUT_TYPES: InputType[] = ["text", "number", "color", "date"]

export const WaitInputFields = ({ step, stepId, updateStep }: Props) => {
  const [placeholder, setPlaceholder] = useState(step.step.placeholder ?? "")
  useEffect(() => setPlaceholder(step.step.placeholder ?? ""), [step.step.placeholder])
  return (
    <>
      <Field label="Type de saisie" stepId={stepId} field="inputType">
        <Select
          value={step.step.inputType ?? "text"}
          onChange={(e) => updateStep({ stepId, inputType: e.target.value as InputType })}
        >
          {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="Placeholder" stepId={stepId} field="placeholder">
        <TextInput
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          onBlur={() => { if (placeholder !== (step.step.placeholder ?? "")) updateStep({ stepId, placeholder }) }}
        />
      </Field>
    </>
  )
}
