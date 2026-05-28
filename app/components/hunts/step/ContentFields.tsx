import { FileImage, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouteLoaderData } from "react-router"
import { MediaPicker } from "~/components/media/MediaPicker"
import { Field } from "~/components/ui/Field"
import { Textarea } from "~/components/ui/Textarea"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { rootLoader } from "~/loaders/rootloader"
import type { HuntStep, StepType } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
  stepType?: StepType
}

export const ContentFields = ({ step, stepId, updateStep, stepType }: Props) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root")
  const huntLoaderData = useRouteLoaderData<{ hunt: { slug: string } | null; slug: string }>("routes/_layout.hunts.$huntId._layout")
  const userId = rootData?.user ? String(rootData.user.id) : undefined
  const huntSlug = huntLoaderData?.slug

  const [content, setContent] = useState(step.step.content ?? "")
  const [desc, setDesc] = useState(step.step.description ?? "")
  const [btnText, setBtnText] = useState(step.step.ValidationButtonText ?? "")
  const [imageUrl, setImageUrl] = useState(step.step.imageUrl ?? "")
  const [imagePicker, setImagePicker] = useState(false)

  useEffect(() => {
    setContent(step.step.content ?? "")
    setDesc(step.step.description ?? "")
    setBtnText(step.step.ValidationButtonText ?? "")
    setImageUrl(step.step.imageUrl ?? "")
  }, [step.step.content, step.step.description, step.step.ValidationButtonText, step.step.imageUrl])

  const handleImageSelect = (key: string) => {
    setImageUrl(key)
    updateStep({ stepId, imageUrl: key })
  }

  const hasImage = stepType === "image" || stepType === "text-with-image"

  const mediaScopes = {
    ...(huntSlug ? { hunt: { huntSlug } } : {}),
    ...(userId ? { user: { userId } } : {}),
  }

  const imageSrc = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `/api/files/${huntSlug ? `hunt-${huntSlug}` : `user-${userId}`}/url?key=${encodeURIComponent(imageUrl)}`
    : null

  return (
    <>
      {hasImage && (
        <Field label="Image" stepId={stepId} field="imageUrl">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setImagePicker(true)}
              className="w-full h-32 rounded-xl border-2 border-dashed border-mauve-500 dark:border-mauve-600 flex flex-col items-center justify-center gap-2 hover:border-mauve-400 dark:hover:border-mauve-500 transition-colors overflow-hidden"
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <>
                  <FileImage size={20} className="text-mauve-400" />
                  <span className="text-xs text-mauve-400">Choisir une image</span>
                </>
              )}
            </button>
            {imageUrl && (
              <div className="flex items-center gap-2">
                <TextInput
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onBlur={() => { if (imageUrl !== (step.step.imageUrl ?? "")) updateStep({ stepId, imageUrl }) }}
                  className="flex-1 text-xs"
                  placeholder="URL ou clé S3"
                />
                <button
                  type="button"
                  onClick={() => { setImageUrl(""); updateStep({ stepId, imageUrl: "" }) }}
                  className="text-mauve-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </Field>
      )}

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

      <MediaPicker
        open={imagePicker}
        onClose={() => setImagePicker(false)}
        onSelect={handleImageSelect}
        scopes={mediaScopes}
        defaultTab="hunt"
      />
    </>
  )
}

export const MediaFields = ({ step, stepId, updateStep }: Omit<Props, "stepType">) => {
  const [videoUrl, setVideoUrl] = useState(step.step.videoUrl ?? "")
  useEffect(() => {
    setVideoUrl(step.step.videoUrl ?? "")
  }, [step.step.videoUrl])

  return (
    <Field label="URL vidéo" stepId={stepId} field="videoUrl">
      <TextInput
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        onBlur={() => { if (videoUrl !== (step.step.videoUrl ?? "")) updateStep({ stepId, videoUrl }) }}
      />
    </Field>
  )
}
