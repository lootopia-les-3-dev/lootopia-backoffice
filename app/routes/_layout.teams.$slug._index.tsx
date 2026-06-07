import axios from "axios"
import { ArrowLeft, Crown, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"
import { Link, useLoaderData, useRevalidator, type LoaderFunction } from "react-router"
import { redirect } from "react-router"
import { Label } from "~/components/ui/Label"
import { TextInput } from "~/components/ui/TextInput"
import type { Team, TeamRole } from "~/types/Team"

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

const roleOptions: { value: TeamRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "collaborator", label: "Collaborator" },
  { value: "admin", label: "Admin" },
]

const TeamDetail = () => {
  const team = useLoaderData<typeof loader>() as Team
  const { revalidate } = useRevalidator()

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamRole>("viewer")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${team.slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: [{ email: email.trim(), role }] }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erreur")
        return
      }
      setEmail("")
      revalidate()
    } catch {
      setError("Erreur réseau")
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (memberEmail: string) => {
    setRemovingEmail(memberEmail)
    try {
      await fetch(`/api/teams/${team.slug}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [memberEmail] }),
      })
      revalidate()
    } finally {
      setRemovingEmail(null)
    }
  }

  const handleRoleChange = async (memberEmail: string, newRole: TeamRole) => {
    await fetch(`/api/teams/${team.slug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: [{ email: memberEmail, role: newRole }] }),
    })
    revalidate()
  }

  return (
    <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 p-14 overflow-y-auto">
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
        <div className="flex flex-col gap-3">
          <Label>Membres ({team.members.length})</Label>

          {team.members.length > 0 && (
            <ul className="flex flex-col gap-2">
              {team.members.map((m) => (
                <li
                  key={m.email}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-mauve-100 dark:bg-mauve-700"
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-mauve-900 dark:text-mauve-50 truncate">
                      {m.firstName} {m.lastName}
                    </span>
                    <span className="text-xs text-mauve-400 truncate">{m.email}</span>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.email, e.target.value as TeamRole)}
                    className="bg-transparent text-xs border border-mauve-300 dark:border-mauve-500 rounded-lg px-2 py-1 text-mauve-700 dark:text-mauve-200 focus:outline-none"
                  >
                    {roleOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.email)}
                    disabled={removingEmail === m.email}
                    className="text-mauve-400 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add member */}
          <form onSubmit={handleAdd} className="flex gap-2 mt-1">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50 placeholder:text-mauve-400"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="bg-mauve-100 dark:bg-mauve-700 border border-mauve-300 dark:border-mauve-500 rounded-lg px-3 py-2 text-sm text-mauve-900 dark:text-mauve-50 focus:outline-none"
            >
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={adding || !email.trim()}
              className="p-2 rounded-lg bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900 hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              <Plus size={18} />
            </button>
          </form>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </main>
  )
}

export default TeamDetail
