import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { Select } from "~/components/ui/Select"
import { TextInput } from "~/components/ui/TextInput"
import type { useHuntManager } from "~/hooks/huntManagerHook"
import type { HuntStep, MatchType, StepFollowedBy } from "~/types/Hunt"

type Props = {
  step: HuntStep
  huntState: ReturnType<typeof useHuntManager>["huntState"]
  upsertEdge: ReturnType<typeof useHuntManager>["upsertEdge"]
  deleteEdge: ReturnType<typeof useHuntManager>["deleteEdge"]
}

export const ConditionsSection = ({ step, huntState, upsertEdge, deleteEdge }: Props) => {
  const getTargetName = (id: string | null) => {
    if (!id) return "?"
    return huntState?.steps.find((s) => s.id === id)?.step.name ?? id.slice(0, 8)
  }

  const validEdges = step.followedBy.filter((f) => !!f.nextStepId)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-mauve-700 dark:text-mauve-300 uppercase tracking-wide">Conditions de sortie</label>
      {validEdges.length === 0 && (
        <p className="text-xs text-mauve-500 italic">Aucune sortie — glisse depuis un handle pour en créer une.</p>
      )}
      {validEdges.map((f) => (
        <ConditionRow
          key={f.nextStepId}
          edge={f}
          targetName={getTargetName(f.nextStepId)}
          onUpdate={(patch) => upsertEdge({ fromStepId: step.id, toStepId: f.nextStepId, ...patch })}
          onDelete={() => deleteEdge({ fromStepId: step.id, toStepId: f.nextStepId })}
        />
      ))}
    </div>
  )
}

type RowProps = {
  edge: StepFollowedBy
  targetName: string
  onUpdate: (patch: { matchType: MatchType; matchValue?: string; regexPattern?: string }) => void
  onDelete: () => void
}

const ConditionRow = ({ edge, targetName, onUpdate, onDelete }: RowProps) => {
  const [matchType, setMatchType] = useState<MatchType>(edge.matchType)
  const [matchValue, setMatchValue] = useState(edge.matchValue ?? "")
  const [regexPattern, setRegexPattern] = useState(edge.regexPattern ?? "")

  useEffect(() => {
    setMatchType(edge.matchType)
    setMatchValue(edge.matchValue ?? "")
    setRegexPattern(edge.regexPattern ?? "")
  }, [edge.matchType, edge.matchValue, edge.regexPattern])

  const handleTypeChange = (t: MatchType) => {
    setMatchType(t)
    onUpdate({
      matchType: t,
      ...(t === "exact" ? { matchValue } : {}),
      ...(t === "regex" ? { regexPattern } : {}),
    })
  }

  const handleValueBlur = () => {
    onUpdate({
      matchType,
      ...(matchType === "exact" ? { matchValue } : {}),
      ...(matchType === "regex" ? { regexPattern } : {}),
    })
  }

  return (
    <div className="flex flex-col gap-1.5 bg-mauve-800 border border-mauve-600 rounded-lg p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-mauve-300 font-medium">→ {targetName}</span>
        <button className="text-mauve-500 hover:text-red-400 transition-colors" onClick={onDelete}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <Select
        className="text-xs rounded px-2 py-1"
        value={matchType}
        onChange={(e) => handleTypeChange(e.target.value as MatchType)}
      >
        <option value="default">default (toujours)</option>
        <option value="exact">exact (valeur exacte)</option>
        <option value="regex">regex (expression)</option>
      </Select>
      {matchType === "exact" && (
        <TextInput
          className="text-xs rounded px-2 py-1"
          placeholder="Valeur attendue…"
          value={matchValue}
          onChange={(e) => setMatchValue(e.target.value)}
          onBlur={handleValueBlur}
        />
      )}
      {matchType === "regex" && (
        <TextInput
          className="text-xs rounded px-2 py-1 font-mono"
          placeholder="^expression$"
          value={regexPattern}
          onChange={(e) => setRegexPattern(e.target.value)}
          onBlur={handleValueBlur}
        />
      )}
    </div>
  )
}
