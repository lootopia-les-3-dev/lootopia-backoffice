import { Plus, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Label } from "~/components/ui/Label"
import { TextInput } from "~/components/ui/TextInput"
import type { TeamRole } from "~/types/Team"

type MemberInput = { email: string; role: TeamRole }

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export const CreateTeamModal = ({ open, onClose, onCreated }: Props) => {
  const [name, setName] = useState("")
  const [members, setMembers] = useState<MemberInput[]>([])
  const [memberEmail, setMemberEmail] = useState("")
  const [memberRole, setMemberRole] = useState<TeamRole>("viewer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setMembers([])
      setMemberEmail("")
      setMemberRole("viewer")
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const addMember = () => {
    const email = memberEmail.trim()
    if (!email || members.find((m) => m.email === email)) return
    setMembers((prev) => [...prev, { email, role: memberRole }])
    setMemberEmail("")
    setMemberRole("viewer")
  }

  const removeMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), members }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erreur lors de la création")
        return
      }

      onCreated()
      onClose()
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-mauve-50 dark:bg-mauve-800 border border-mauve-200 dark:border-mauve-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-mauve-900 dark:text-mauve-50">
            Nouvelle équipe
          </h2>
          <button
            onClick={onClose}
            className="text-mauve-400 hover:text-mauve-600 dark:hover:text-mauve-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Nom de l'équipe</Label>
            <TextInput
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon équipe"
              className="bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50 placeholder:text-mauve-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Membres (optionnel)</Label>
            <div className="flex gap-2">
              <TextInput
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember() } }}
                placeholder="email@exemple.com"
                type="email"
                className="flex-1 bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50 placeholder:text-mauve-400"
              />
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as TeamRole)}
                className="bg-mauve-100 dark:bg-mauve-700 border border-mauve-300 dark:border-mauve-500 rounded-lg px-3 py-2 text-mauve-900 dark:text-mauve-50 focus:outline-none focus:border-mauve-400 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="collaborator">Collaborator</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={addMember}
                className="p-2 rounded-lg bg-mauve-200 dark:bg-mauve-600 hover:bg-mauve-300 dark:hover:bg-mauve-500 transition-colors"
              >
                <Plus size={18} className="text-mauve-700 dark:text-mauve-200" />
              </button>
            </div>

            {members.length > 0 && (
              <ul className="flex flex-col gap-1 mt-1">
                {members.map((m) => (
                  <li
                    key={m.email}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-mauve-100 dark:bg-mauve-700 text-sm text-mauve-800 dark:text-mauve-100"
                  >
                    <span className="truncate">{m.email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-mauve-400 capitalize">{m.role}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.email)}
                        className="text-mauve-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-mauve-600 dark:text-mauve-300 hover:bg-mauve-100 dark:hover:bg-mauve-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900 font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
