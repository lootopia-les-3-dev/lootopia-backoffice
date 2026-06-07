import axios from "axios"
import { X } from "lucide-react"
import { Link, useLoaderData, type LoaderFunction } from "react-router"
import { Label } from "~/components/ui/Label"

type HuntStats = {
  totalParticipants: number
  completions: number
  totalSteps: number
  completionRate: number
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const { huntId } = params
  const stats = await axios
    .get<HuntStats>(`${process.env.API_URL}hunts/${huntId}/stats`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    })
    .then((r) => r.data)
    .catch(() => null)

  return { stats }
}

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="flex flex-col gap-1 px-5 py-4 rounded-xl bg-mauve-100 dark:bg-mauve-700">
    <Label>{label}</Label>
    <p className="text-3xl font-bold text-mauve-900 dark:text-mauve-50">{value}</p>
    {sub && <p className="text-xs text-mauve-400">{sub}</p>}
  </div>
)

const StatsPage = () => {
  const { stats } = useLoaderData<typeof loader>() as { stats: HuntStats | null }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-mauve-900 dark:text-mauve-50">Statistiques</h2>
        <Link to=".." className="p-1 hover:opacity-60 transition-opacity"><X className="h-5 w-5" /></Link>
      </div>

      {!stats ? (
        <p className="text-sm text-mauve-400 py-8 text-center">Impossible de charger les statistiques</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Participants" value={stats.totalParticipants} />
          <StatCard label="Completions" value={stats.completions} />
          <StatCard
            label="Taux de complétion"
            value={`${stats.completionRate}%`}
            sub={`${stats.completions} / ${stats.totalParticipants} joueurs`}
          />
          <StatCard label="Étapes" value={stats.totalSteps} />
        </div>
      )}
    </div>
  )
}

export default StatsPage
