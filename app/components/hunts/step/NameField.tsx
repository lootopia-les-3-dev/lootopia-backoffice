import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const NameField = ({ step, stepId, updateStep }: Props) => {
  const [name, setName] = useState(step.step.name)
  useEffect(() => setName(step.step.name), [step.step.name])
  return (
    <Field label="Nom" stepId={stepId} field="name">
      <TextInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => { if (name !== step.step.name) updateStep({ stepId, name }) }}
      />
    </Field>
  )
}
