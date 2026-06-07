import { FileImage, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useRouteLoaderData } from "react-router"
import { MediaPicker } from "~/components/media/MediaPicker"
import { Label } from "~/components/ui/Label"
import { MediaPreview } from "~/components/ui/MediaPreview"
import { TextInput } from "~/components/ui/TextInput"
import type { rootLoader } from "~/loaders/rootloader"
import type { TeamLight } from "~/types/Team"

type Props = {
  open: boolean
  onClose: () => void
  teams: TeamLight[]
}

export const CreateHuntModal = ({ open, onClose, teams }: Props) => {
  const loaderData = useRouteLoaderData<typeof rootLoader>("root")
  const user = loaderData?.user

  const [name, setName] = useState("")
  const [teamSlug, setTeamSlug] = useState("")
  const [coverKey, setCoverKey] = useState<string | null>(null)
  const [mediaPicker, setMediaPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setName("")
      setTeamSlug("")
      setCoverKey(null)
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          teamSlug: teamSlug || undefined,
          coverKey: coverKey || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erreur lors de la création")
        return
      }

      const hunt = await res.json()
      onClose()
      navigate(`/hunts/${encodeURIComponent(hunt.slug)}`)
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  const mediaScopes = {
    ...(user ? { user: { userId: String(user.id) } } : {}),
    ...(teamSlug ? { team: { teamSlug } } : {}),
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-md bg-mauve-50 dark:bg-mauve-800 border border-mauve-200 dark:border-mauve-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-mauve-900 dark:text-mauve-50">Nouvelle hunt</h2>
            <button onClick={onClose} className="text-mauve-400 hover:text-mauve-600 dark:hover:text-mauve-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Cover */}
            <div className="flex flex-col gap-1">
              <Label>Cover (optionnel)</Label>
              <button
                type="button"
                onClick={() => setMediaPicker(true)}
                className="w-full h-32 rounded-xl border-2 border-dashed border-mauve-300 dark:border-mauve-600 flex flex-col items-center justify-center gap-2 hover:border-mauve-400 dark:hover:border-mauve-400 transition-colors overflow-hidden"
              >
                {coverKey ? (
                  <MediaPreview
                    src={`/api/files/user-${user?.id}/url?key=${encodeURIComponent(coverKey)}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <FileImage size={24} className="text-mauve-400" />
                    <span className="text-sm text-mauve-400">Choisir une image</span>
                  </>
                )}
              </button>
              {coverKey && (
                <button
                  type="button"
                  onClick={() => setCoverKey(null)}
                  className="text-xs text-mauve-400 hover:text-red-500 text-left transition-colors"
                >
                  Supprimer la cover
                </button>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <Label>Nom</Label>
              <TextInput
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ma super hunt"
                className="bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50 placeholder:text-mauve-400"
              />
            </div>

            {/* Team */}
            {teams.length > 0 && (
              <div className="flex flex-col gap-1">
                <Label>Équipe (optionnel)</Label>
                <select
                  value={teamSlug}
                  onChange={(e) => setTeamSlug(e.target.value)}
                  className="bg-mauve-100 dark:bg-mauve-700 border border-mauve-300 dark:border-mauve-500 rounded-lg px-3 py-2 text-mauve-900 dark:text-mauve-50 focus:outline-none focus:border-mauve-400"
                >
                  <option value="">Personnel</option>
                  {teams.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

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

      <MediaPicker
        open={mediaPicker}
        onClose={() => setMediaPicker(false)}
        onSelect={(key) => setCoverKey(key)}
        scopes={mediaScopes}
        defaultTab="user"
      />
    </>
  )
}
