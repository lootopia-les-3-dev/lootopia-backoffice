import { FileImage, X } from "lucide-react"
import { MediaPreview } from "~/components/ui/MediaPreview"
import { useState } from "react"
import { useRouteLoaderData } from "react-router"
import { MediaPicker } from "~/components/media/MediaPicker"
import { Field } from "~/components/ui/Field"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { rootLoader } from "~/loaders/rootloader"
import type { HuntStep } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
  field?: string
  label?: string
}

const scoopFromKey = (key: string, fallback: string) =>
  key.includes("/") ? key.split("/")[0] : fallback

export const MediaUrlField = ({
  step,
  stepId,
  updateStep,
  field = "mediaUrl",
  label = "Média",
}: Props) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root")
  const huntLoaderData = useRouteLoaderData<{ slug: string }>("routes/_layout.hunts.$huntId._layout")
  const userId = rootData?.user ? String(rootData.user.id) : undefined
  const huntSlug = huntLoaderData?.slug

  const [picker, setPicker] = useState(false)
  const value = (step.step[field] as string | undefined) ?? ""

  const set = (val: string) => updateStep({ stepId, [field]: val })

  const src = value
    ? value.startsWith("http")
      ? value
      : `/api/files/${scoopFromKey(value, `hunt-${huntSlug}`)}/url?key=${encodeURIComponent(value)}`
    : null

  const mediaScopes = {
    ...(huntSlug ? { hunt: { huntSlug } } : {}),
    ...(userId ? { user: { userId } } : {}),
  }

  return (
    <>
      <Field label={label} stepId={stepId} field={field}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPicker(true)}
            className="w-full h-36 rounded-xl border-2 border-dashed border-mauve-500 dark:border-mauve-600 flex flex-col items-center justify-center gap-2 hover:border-mauve-400 dark:hover:border-mauve-500 transition-colors overflow-hidden"
          >
            {src && (
              <MediaPreview src={src} className="w-full h-full object-cover" />
            )}
            {!src && (
              <>
                <FileImage size={20} className="text-mauve-400" />
                <span className="text-xs text-mauve-400">Choisir une image ou vidéo</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <TextInput
              value={value}
              onChange={(e) => set(e.target.value)}
              onBlur={() => { if (value !== (step.step[field] as string ?? "")) set(value) }}
              className="flex-1 text-xs"
              placeholder="URL libre ou clé S3"
            />
            {value && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => set("")}
                className="text-mauve-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </Field>

      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(key) => set(key)}
        scopes={mediaScopes}
        defaultTab="hunt"
      />
    </>
  )
}
