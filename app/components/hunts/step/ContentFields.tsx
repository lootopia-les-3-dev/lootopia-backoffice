import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Textarea } from "~/components/ui/Textarea"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, StepType } from "~/types/Hunt"
import { MediaUrlField } from "./MediaUrlField"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
  stepType?: StepType
}

const TextContent = ({ step, stepId, updateStep }: Omit<Props, "stepType">) => {
  const [content, setContent] = useState(step.step.content ?? "")
  const [desc, setDesc] = useState(step.step.description ?? "")
  const [btnText, setBtnText] = useState(step.step.ValidationButtonText ?? "")

  useEffect(() => {
    setContent(step.step.content ?? "")
    setDesc(step.step.description ?? "")
    setBtnText(step.step.ValidationButtonText ?? "")
  }, [step.step.content, step.step.description, step.step.ValidationButtonText])

  return (
    <>
      <Field label="Description" stepId={stepId} field="description">
        <Textarea className="min-h-16" value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => { if (desc !== (step.step.description ?? "")) updateStep({ stepId, description: desc }) }}
        />
      </Field>
      <Field label="Contenu" stepId={stepId} field="content">
        <Textarea className="min-h-24" value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => { if (content !== (step.step.content ?? "")) updateStep({ stepId, content }) }}
        />
      </Field>
      <Field label="Texte bouton validation" stepId={stepId} field="ValidationButtonText">
        <TextInput value={btnText}
          onChange={(e) => setBtnText(e.target.value)}
          onBlur={() => { if (btnText !== (step.step.ValidationButtonText ?? "")) updateStep({ stepId, ValidationButtonText: btnText }) }}
        />
      </Field>
    </>
  )
}

export const ContentFields = ({ step, stepId, updateStep, stepType }: Props) => {
  if (stepType === "image") {
    return <MediaUrlField step={step} stepId={stepId} updateStep={updateStep} />
  }

  if (stepType === "text-with-image") {
    return (
      <>
        <MediaUrlField step={step} stepId={stepId} updateStep={updateStep} />
        <TextContent step={step} stepId={stepId} updateStep={updateStep} />
      </>
    )
  }

  return <TextContent step={step} stepId={stepId} updateStep={updateStep} />
}

export const MediaFields = (_: Omit<Props, "stepType">) => null
