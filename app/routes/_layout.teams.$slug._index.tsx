import axios from "axios"
import { ArrowLeft, Crown, Users } from "lucide-react"
import { Link, useLoaderData, type LoaderFunction } from "react-router"
import { redirect } from "react-router"
import { Label } from "~/components/ui/Label"
import type { Team } from "~/types/Team"

export const loader: LoaderFunction = async ({ params, request }) => {
  const { slug } = params
  const team = await axios.get<Team>(`${process.env.API_URL}teams/${slug}`, {
    headers: { cookie: request.headers.get("cookie") || "" },
  })
    .then((res) => res.data)
    .catch((err) => {
      if (err?.response?.status === 401) {
        throw redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)
      }
      return null
    })

  if (!team) throw new Response("Not found", { status: 404 })
  return team
}

const roleBadge: Record<string, string> = {
  admin: "bg-purple-500/15 text-purple-400",
  collaborator: "bg-blue-500/15 text-blue-400",
  viewer: "bg-mauve-300/30 dark:bg-mauve-600/30 text-mauve-500 dark:text-mauve-400",
}

const TeamDetail = () => {
  const team = useLoaderData<typeof loader>() as Team

  return (
    <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 p-14">
      <Link
        to="/teams"
        className="flex items-center gap-2 text-sm text-mauve-500 dark:text-mauve-400 hover:text-mauve-700 dark:hover:text-mauve-200 transition-colors mb-6 w-fit"
      >
        <ArrowLeft size={16} /> Équipes
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-mauve-300 dark:bg-mauve-700 flex items-center justify-center">
          <Users size={22} className="text-mauve-600 dark:text-mauve-300" />
        </div>
        <h1 className="text-2xl font-semibold text-mauve-900 dark:text-mauve-50">{team.name}</h1>
      </div>

      <div className="flex flex-col gap-6 max-w-xl">
        {/* Owner */}
        <div className="flex flex-col gap-2">
          <Label>Propriétaire</Label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-mauve-100 dark:bg-mauve-700">
            <Crown size={16} className="text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-mauve-900 dark:text-mauve-50">
                {team.owner.firstName} {team.owner.lastName}
              </span>
              <span className="text-xs text-mauve-400">{team.owner.email}</span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-2">
          <Label>Membres ({team.members.length})</Label>
          {team.members.length === 0 ? (
            <p className="text-sm text-mauve-400 px-4 py-3">Aucun membre</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {team.members.map((m) => (
                <li
                  key={m.email}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-mauve-100 dark:bg-mauve-700"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-mauve-900 dark:text-mauve-50">
                      {m.firstName} {m.lastName}
                    </span>
                    <span className="text-xs text-mauve-400">{m.email}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleBadge[m.role] ?? ""}`}>
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

export default TeamDetail
