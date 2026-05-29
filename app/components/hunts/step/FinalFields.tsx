import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Textarea } from "~/components/ui/Textarea"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"
import { MediaUrlField } from "./MediaUrlField"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const FinalFields = ({ step, stepId, updateStep }: Props) => {
  const [msg, setMsg] = useState(step.step.FinalMessage ?? "")
  const [btn, setBtn] = useState(step.step.FinalButtonText ?? "")

  useEffect(() => {
    setMsg(step.step.FinalMessage ?? "")
    setBtn(step.step.FinalButtonText ?? "")
  }, [step.step.FinalMessage, step.step.FinalButtonText])

  return (
    <>
      <Field label="Message final" stepId={stepId} field="FinalMessage">
        <Textarea className="min-h-16" value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onBlur={() => { if (msg !== (step.step.FinalMessage ?? "")) updateStep({ stepId, FinalMessage: msg }) }}
        />
      </Field>

      <MediaUrlField
        step={step}
        stepId={stepId}
        updateStep={updateStep}
        field="FinalMediaUrl"
        label="Média final"
      />

      <Field label="Texte bouton final" stepId={stepId} field="FinalButtonText">
        <TextInput value={btn}
          onChange={(e) => setBtn(e.target.value)}
          onBlur={() => { if (btn !== (step.step.FinalButtonText ?? "")) updateStep({ stepId, FinalButtonText: btn }) }}
        />
      </Field>
    </>
  )
}
