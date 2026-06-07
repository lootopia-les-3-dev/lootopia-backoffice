import axios from "axios"
import { CheckCircle, Clock, X } from "lucide-react"
import { Link, useLoaderData, useRouteLoaderData, type LoaderFunction } from "react-router"
import { Label } from "~/components/ui/Label"

type Participant = {
  email: string
  firstName: string
  lastName: string
  currentStepId: string | null
  currentStepType: string | null
  currentStepName: string | null
  totalSteps: number
  completed: boolean
}

type LoaderData = { slug: string }

export const loader: LoaderFunction = async ({ params, request }) => {
  const { huntId } = params
  const participants = await axios
    .get<Participant[]>(`${process.env.API_URL}hunts/${huntId}/participants`, {
      headers: { cookie: request.headers.get("cookie") || "" },
    })
    .then((r) => r.data)
    .catch(() => [] as Participant[])

  return { participants, slug: huntId }
}

const UsersPage = () => {
  const { participants } = useLoaderData<typeof loader>() as { participants: Participant[]; slug: string }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-mauve-900 dark:text-mauve-50">
          Joueurs <span className="text-lg font-normal text-mauve-400">({participants.length})</span>
        </h2>
        <Link to=".." className="p-1 hover:opacity-60 transition-opacity"><X className="h-5 w-5" /></Link>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-mauve-400 py-8 text-center">Aucun joueur pour le moment</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {participants.map((p) => (
            <li key={p.email} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-mauve-100 dark:bg-mauve-700">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-mauve-900 dark:text-mauve-50 truncate">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-xs text-mauve-400 truncate">{p.email}</span>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {p.completed ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <CheckCircle size={14} /> Terminé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-mauve-400">
                    <Clock size={14} />
                    {p.currentStepName ?? p.currentStepType ?? "En attente"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default UsersPage
