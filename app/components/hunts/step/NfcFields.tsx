import { Nfc } from "lucide-react"
import { useEffect, useState } from "react"
import { Field } from "~/components/ui/Field"
import { Textarea } from "~/components/ui/Textarea"
import { TextInput } from "~/components/ui/TextInput"
import { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const NfcFields = ({ step, stepId, updateStep }: Props) => {
  const { socketRef } = useHuntManager()
  const [code, setCode] = useState(step.step.code ?? "")
  const [desc, setDesc] = useState(step.step.description ?? "")
  const [btnText, setBtnText] = useState(step.step.ValidationButtonText ?? "")

  useEffect(() => {
    setCode(step.step.code ?? "")
    setDesc(step.step.description ?? "")
    setBtnText(step.step.ValidationButtonText ?? "")
  }, [step.step.code, step.step.description, step.step.ValidationButtonText])

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
      <Field label="Code NFC (laisser vide pour multidirectionnel)" stepId={stepId} field="code">
        <TextInput
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => { if (code !== (step.step.code ?? "")) updateStep({ stepId, code }) }}
          placeholder="ex: 04:A3:2F:1B"
        />
      </Field>
      <Field label="Texte du bouton scan" stepId={stepId} field="ValidationButtonText">
        <TextInput
          value={btnText}
          onChange={(e) => setBtnText(e.target.value)}
          onBlur={() => { if (btnText !== (step.step.ValidationButtonText ?? "")) updateStep({ stepId, ValidationButtonText: btnText }) }}
          placeholder="ex: Scanner le tag NFC"
        />
      </Field>
      <button
        type="button"
        disabled={!code}
        onClick={() => socketRef.current?.emit("nfc:write", { stepId, code })}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-mauve-400 hover:bg-mauve-200 dark:hover:bg-mauve-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Nfc className="h-4 w-4" />
        Write
      </button>
    </>
  )
}
