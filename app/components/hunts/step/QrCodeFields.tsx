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

export const QrCodeFields = ({ step, stepId, updateStep }: Props) => {
  const [code, setCode] = useState(step.step.code ?? "")
  useEffect(() => setCode(step.step.code ?? ""), [step.step.code])
  return (
    <Field label="Code QR - laisser vide pour traitement multidirectionnel" stepId={stepId} field="code">
      <TextInput
        className="font-mono"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onBlur={() => { if (code !== (step.step.code ?? "")) updateStep({ stepId, code }) }}
      />
    </Field>
  )
}
