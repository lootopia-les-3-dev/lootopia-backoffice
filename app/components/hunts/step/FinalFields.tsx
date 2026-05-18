import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Textarea } from "~/components/ui/Textarea"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const FinalFields = ({ step, stepId, updateStep }: Props) => {
  const [msg, setMsg] = useState(step.step.FinalMessage ?? "")
  const [imgUrl, setImgUrl] = useState(step.step.FinalImageUrl ?? "")
  const [videoUrl, setVideoUrl] = useState(step.step.FinalVideoUrl ?? "")
  const [btn, setBtn] = useState(step.step.FinalButtonText ?? "")

  useEffect(() => {
    setMsg(step.step.FinalMessage ?? "")
    setImgUrl(step.step.FinalImageUrl ?? "")
    setVideoUrl(step.step.FinalVideoUrl ?? "")
    setBtn(step.step.FinalButtonText ?? "")
  }, [step.step.FinalMessage, step.step.FinalImageUrl, step.step.FinalVideoUrl, step.step.FinalButtonText])

  return (
    <>
      <Field label="Message final" stepId={stepId} field="FinalMessage">
        <Textarea
          className="min-h-16"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onBlur={() => { if (msg !== (step.step.FinalMessage ?? "")) updateStep({ stepId, FinalMessage: msg }) }}
        />
      </Field>
      <Field label="Image finale (URL)" stepId={stepId} field="FinalImageUrl">
        <TextInput
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
          onBlur={() => { if (imgUrl !== (step.step.FinalImageUrl ?? "")) updateStep({ stepId, FinalImageUrl: imgUrl }) }}
        />
      </Field>
      <Field label="Vidéo finale (URL)" stepId={stepId} field="FinalVideoUrl">
        <TextInput
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onBlur={() => { if (videoUrl !== (step.step.FinalVideoUrl ?? "")) updateStep({ stepId, FinalVideoUrl: videoUrl }) }}
        />
      </Field>
      <Field label="Texte bouton final" stepId={stepId} field="FinalButtonText">
        <TextInput
          value={btn}
          onChange={(e) => setBtn(e.target.value)}
          onBlur={() => { if (btn !== (step.step.FinalButtonText ?? "")) updateStep({ stepId, FinalButtonText: btn }) }}
        />
      </Field>
    </>
  )
}
