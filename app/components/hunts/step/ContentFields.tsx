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

export const ContentFields = ({ step, stepId, updateStep }: Props) => {
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
        <Textarea
          className="min-h-16"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => { if (desc !== (step.step.description ?? "")) updateStep({ stepId, description: desc }) }}
        />
      </Field>
      <Field label="Contenu" stepId={stepId} field="content">
        <Textarea
          className="min-h-24"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => { if (content !== (step.step.content ?? "")) updateStep({ stepId, content }) }}
        />
      </Field>
      <Field label="Texte bouton validation" stepId={stepId} field="ValidationButtonText">
        <TextInput
          value={btnText}
          onChange={(e) => setBtnText(e.target.value)}
          onBlur={() => { if (btnText !== (step.step.ValidationButtonText ?? "")) updateStep({ stepId, ValidationButtonText: btnText }) }}
        />
      </Field>
    </>
  )
}

export const MediaFields = ({ step, stepId, updateStep }: Props) => {
  const [imageUrl, setImageUrl] = useState(step.step.imageUrl ?? "")
  const [videoUrl, setVideoUrl] = useState(step.step.videoUrl ?? "")
  useEffect(() => {
    setImageUrl(step.step.imageUrl ?? "")
    setVideoUrl(step.step.videoUrl ?? "")
  }, [step.step.imageUrl, step.step.videoUrl])
  return (
    <>
      <Field label="URL image" stepId={stepId} field="imageUrl">
        <TextInput
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onBlur={() => { if (imageUrl !== (step.step.imageUrl ?? "")) updateStep({ stepId, imageUrl }) }}
        />
      </Field>
      <Field label="URL vidéo" stepId={stepId} field="videoUrl">
        <TextInput
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onBlur={() => { if (videoUrl !== (step.step.videoUrl ?? "")) updateStep({ stepId, videoUrl }) }}
        />
      </Field>
    </>
  )
}
