import { Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLoaderData, useNavigate } from "react-router"
import { ArFields } from "~/components/hunts/step/ArFields"
import { ConditionsSection } from "~/components/hunts/step/ConditionsSection"
import { ContentFields } from "~/components/hunts/step/ContentFields"
import { FinalFields } from "~/components/hunts/step/FinalFields"
import { GeoFields } from "~/components/hunts/step/GeoFields"
import { GoToStepFields } from "~/components/hunts/step/GoToStepFields"
import { NameField } from "~/components/hunts/step/NameField"
import { QrCodeFields } from "~/components/hunts/step/QrCodeFields"
import { TypeField } from "~/components/hunts/step/TypeField"
import { WaitInputFields } from "~/components/hunts/step/WaitInputFields"
import { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, StepType } from "~/types/Hunt"

export const loader = async ({ params }: { params: { huntId: string; stepId: string } }) => {
  return { stepId: params.stepId, huntId: params.huntId }
}

const StepPanel = () => {
  const { stepId, huntId } = useLoaderData<typeof loader>()
  const { huntState, updateStep, deleteEdge, upsertEdge } = useHuntManager()
  const navigate = useNavigate()
  const [step, setStep] = useState<HuntStep | null>(null)
  const [optimisticType, setOptimisticType] = useState<StepType | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setStep(huntState?.steps.find((s) => s.id === stepId) ?? null)
    setOptimisticType(null)
  }, [huntState, stepId])

  if (!step) return null

  const displayType = optimisticType ?? step.step.type

  const collapseWarning = (() => {
    if (!huntState) return null
    const parents = huntState.steps.filter((s) => s.followedBy.some((f) => f.nextStepId === stepId))
    if (parents.length === 0) return "Ce nœud n'a pas de parent — ses enfants seront détachés."
    if (step.followedBy.length > 1) return "Ce nœud a plusieurs sorties — chaque parent sera reconnecté à toutes les sorties."
    return null
  })()

  const handleCollapse = () => {
    if (!huntState) return
    const parents = huntState.steps.filter((s) => s.followedBy.some((f) => f.nextStepId === stepId))
    for (const parent of parents) {
      for (const child of step.followedBy) {
        upsertEdge({
          fromStepId: parent.id,
          toStepId: child.nextStepId,
          matchType: child.matchType,
          ...(child.matchValue ? { matchValue: child.matchValue } : {}),
          ...(child.regexPattern ? { regexPattern: child.regexPattern } : {}),
        })
      }
      deleteEdge({ fromStepId: parent.id, toStepId: stepId })
    }
    for (const child of step.followedBy) {
      deleteEdge({ fromStepId: stepId, toStepId: child.nextStepId })
    }
    navigate(`/hunts/${huntId}`)
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl text-mauve-800 dark:text-mauve-50">{displayType}</h2>
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <div className="flex flex-col items-end gap-1">
              {collapseWarning && (
                <p className="text-[10px] text-amber-400 max-w-45 text-right">{collapseWarning}</p>
              )}
              <div className="flex gap-1">
                <button className="text-xs text-mauve-300 hover:opacity-60 px-2 py-1" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </button>
                <button className="text-xs text-red-400 hover:opacity-60 px-2 py-1 font-semibold" onClick={handleCollapse}>
                  Confirmer
                </button>
              </div>
            </div>
          ) : (
            <button
              className="p-1 hover:opacity-60 text-mauve-400 hover:text-red-400 transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Link to=".." className="p-1 hover:opacity-60"><X className="h-5 w-5" /></Link>
        </div>
      </div>

      <NameField step={step} stepId={stepId} updateStep={updateStep} />
      <TypeField step={step} stepId={stepId} updateStep={updateStep} onTypeChange={setOptimisticType} hasChildren={step.followedBy.length > 0} />

      {displayType !== "start" && (
        <>
          {(displayType === "text" || displayType === "image" || displayType === "text-with-image") && (
            <ContentFields step={step} stepId={stepId} updateStep={updateStep} stepType={displayType} />
          )}
          {displayType === "qr-code" && <QrCodeFields step={step} stepId={stepId} updateStep={updateStep} />}
          {displayType === "wait-input" && <WaitInputFields step={step} stepId={stepId} updateStep={updateStep} />}
          {displayType === "geo" && <GeoFields step={step} stepId={stepId} updateStep={updateStep} />}
          {displayType === "ar" && <ArFields step={step} stepId={stepId} updateStep={updateStep} />}
          {displayType === "final" && <FinalFields step={step} stepId={stepId} updateStep={updateStep} />}
          {displayType === "multi-directional" && (
            <ConditionsSection step={step} huntState={huntState} upsertEdge={upsertEdge} deleteEdge={deleteEdge} />
          )}
          {displayType === "go-to-step" && (
            <GoToStepFields step={step} stepId={stepId} updateStep={updateStep} />
          )}
        </>
      )}
    </div>
  )
}

export default StepPanel
