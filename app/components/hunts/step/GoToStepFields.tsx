import { useEffect, useState } from "react"
import { useRouteLoaderData } from "react-router"
import { Field } from "~/components/ui/Field"
import { Label } from "~/components/ui/Label"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep } from "~/types/Hunt"

type Target = { id: string; name: string; type: string }

type Props = {
  step: HuntStep
  stepId: string
  updateStep: ReturnType<typeof useHuntManager>["updateStep"]
}

export const GoToStepFields = ({ step, stepId, updateStep }: Props) => {
  const huntLoaderData = useRouteLoaderData<{ slug: string }>("routes/_layout.hunts.$huntId._layout")
  const huntSlug = huntLoaderData?.slug ?? ""

  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(false)

  const currentTarget = (step.step.targetStepId as string | undefined) ?? ""

  useEffect(() => {
    if (!huntSlug || !stepId) return
    setLoading(true)
    fetch(`/api/hunts/${huntSlug}/steps/${stepId}/goto`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setTargets(d) : setTargets([]))
      .catch(() => setTargets([]))
      .finally(() => setLoading(false))
  }, [huntSlug, stepId])

  return (
    <Field label="Étape cible" stepId={stepId} field="targetStepId">
      {loading ? (
        <p className="text-sm text-mauve-400">Chargement des étapes...</p>
      ) : targets.length === 0 ? (
        <p className="text-sm text-mauve-400 italic">Aucune étape cible disponible</p>
      ) : (
        <select
          value={currentTarget}
          onChange={(e) => updateStep({ stepId, targetStepId: e.target.value })}
          className="w-full bg-mauve-700 border border-mauve-500 rounded-lg px-3 py-2 text-mauve-50 focus:outline-none focus:border-mauve-300"
        >
          <option value="">— Choisir une étape —</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} <span className="text-mauve-400">({t.type})</span>
            </option>
          ))}
        </select>
      )}
      {currentTarget && (
        <p className="text-xs text-mauve-400 mt-1 italic">
          Saut automatique — aucune interaction joueur
        </p>
      )}
    </Field>
  )
}
