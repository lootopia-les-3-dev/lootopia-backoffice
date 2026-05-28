import axios from "axios"
import { FileImage, FolderOpen, Search, Upload, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { redirect, useLoaderData, type LoaderFunction } from "react-router"
import { Label } from "~/components/ui/Label"
import { TextInput } from "~/components/ui/TextInput"
import type { HuntLight } from "~/types/Hunt"
import type { TeamLight } from "~/types/Team"

type LoaderData = {
  hunts: HuntLight[]
  teams: TeamLight[]
  userId: string
}

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie") || ""

  const { data: user } = await axios.get(`${process.env.SSO_URL}/api/auth/me`, {
    headers: { cookie },
  }).catch(() => ({ data: null }))

  if (!user) throw redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)

  const [hunts, teams] = await Promise.all([
    axios.get(`${process.env.API_URL}hunts`, { headers: { cookie } })
      .then((r): HuntLight[] => r.data).catch(() => [] as HuntLight[]),
    axios.get(`${process.env.API_URL}teams`, { headers: { cookie } })
      .then((r): TeamLight[] => r.data).catch(() => [] as TeamLight[]),
  ])

  return { hunts, teams, userId: String(user.id) } satisfies LoaderData
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeEntry =
  | { kind: "user"; userId: string; label: string; scoopSlug: string }
  | { kind: "team"; teamSlug: string; label: string; scoopSlug: string }
  | { kind: "hunt"; huntSlug: string; label: string; scoopSlug: string }

type FileItem = {
  key: string
  type: "file" | "folder"
  size?: number
  relativePath: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|svg|avif)$/i

const formatSize = (bytes?: number) => {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── FileGrid ─────────────────────────────────────────────────────────────────

type FileGridProps = {
  scoopSlug: string
  search: string
  onUploadDone?: () => void
}

const FileGrid = ({ scoopSlug, search, onUploadDone }: FileGridProps) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/files/${scoopSlug}`)
      if (res.ok) setFiles(await res.json())
    } finally {
      setLoading(false)
    }
  }, [scoopSlug])

  useEffect(() => { load() }, [load])

  const uploadFile = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch(`/api/files/${scoopSlug}`, { method: "POST", body: fd })
      if (res.ok) { await load(); onUploadDone?.() }
    } finally {
      setUploading(false)
    }
  }

  const imageFiles = files.filter(
    (f) => f.type === "file" && IMAGE_EXTS.test(f.relativePath) &&
      (!search || f.relativePath.toLowerCase().includes(search.toLowerCase()))
  )
  const otherFiles = files.filter(
    (f) => f.type === "file" && !IMAGE_EXTS.test(f.relativePath) &&
      (!search || f.relativePath.toLowerCase().includes(search.toLowerCase()))
  )

  const isEmpty = imageFiles.length === 0 && otherFiles.length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-sm
          ${dragOver ? "border-purple-500 bg-purple-500/10 text-purple-500" : "border-mauve-300 dark:border-mauve-600 text-mauve-400 hover:border-mauve-400"}`}
      >
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
        <Upload size={14} />
        <span>{uploading ? "Upload en cours..." : "Glisser ou cliquer pour uploader"}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-mauve-400">Chargement...</div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-mauve-400">
          <FolderOpen size={28} />
          <span className="text-sm">{search ? "Aucun résultat" : "Aucun fichier"}</span>
        </div>
      ) : (
        <>
          {imageFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {imageFiles.map((f) => (
                <div
                  key={f.key}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-mauve-100 dark:bg-mauve-700"
                >
                  <img
                    src={`/api/files/${scoopSlug}/url?key=${encodeURIComponent(f.key)}`}
                    alt={f.relativePath}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-1 bg-black/60 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.relativePath}
                  </div>
                </div>
              ))}
            </div>
          )}
          {otherFiles.length > 0 && (
            <div className="flex flex-col gap-1">
              {otherFiles.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-mauve-100 dark:bg-mauve-700"
                >
                  <FileImage size={16} className="text-mauve-400 shrink-0" />
                  <span className="text-sm truncate text-mauve-800 dark:text-mauve-100">{f.relativePath}</span>
                  {f.size !== undefined && (
                    <span className="ml-auto text-xs text-mauve-400 shrink-0">{formatSize(f.size)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterKind = "all" | "hunt" | "team" | "user"

const MediaPage = () => {
  const { hunts, teams, userId } = useLoaderData<typeof loader>() as LoaderData

  const [filterKind, setFilterKind] = useState<FilterKind>("all")
  const [search, setSearch] = useState("")
  const [expandedScoop, setExpandedScoop] = useState<string | null>(null)

  const scopes: ScopeEntry[] = [
    { kind: "user", userId, label: "Mes fichiers", scoopSlug: `user-${userId}` },
    ...teams.map((t): ScopeEntry => ({ kind: "team", teamSlug: t.slug, label: t.name, scoopSlug: `team-${t.slug}` })),
    ...hunts.map((h): ScopeEntry => ({ kind: "hunt", huntSlug: h.slug, label: h.name, scoopSlug: `hunt-${h.slug}` })),
  ]

  const filtered = scopes.filter((s) => filterKind === "all" || s.kind === filterKind)

  const filterButtons: { key: FilterKind; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "user", label: "Personnel" },
    { key: "team", label: "Équipes" },
    { key: "hunt", label: "Hunts" },
  ]

  const kindLabel: Record<string, string> = {
    user: "Personnel",
    team: "Équipe",
    hunt: "Hunt",
  }

  return (
    <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-mauve-200 dark:bg-mauve-600 border-b border-mauve-300 dark:border-mauve-500 px-10 py-4 flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-mauve-900 dark:text-mauve-50 mr-2">Médiathèque</h1>

        {/* Kind filter */}
        <div className="flex gap-1">
          {filterButtons.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterKind(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filterKind === f.key
                  ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                  : "text-mauve-500 dark:text-mauve-400 hover:bg-mauve-300 dark:hover:bg-mauve-700"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve-400 pointer-events-none" />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-8 pr-8 py-1.5 text-sm bg-mauve-100 dark:bg-mauve-700 border-mauve-300 dark:border-mauve-500 text-mauve-900 dark:text-mauve-50 w-56"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-mauve-400 hover:text-mauve-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scoop sections */}
      <div className="flex flex-col gap-0 px-10 py-6">
        {filtered.length === 0 && (
          <p className="text-sm text-mauve-400 py-12 text-center">Aucune source de fichiers</p>
        )}
        {filtered.map((scope) => {
          const isOpen = expandedScoop === scope.scoopSlug
          return (
            <div key={scope.scoopSlug} className="border-b border-mauve-300 dark:border-mauve-500 last:border-0">
              <button
                onClick={() => setExpandedScoop(isOpen ? null : scope.scoopSlug)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-mauve-900 dark:text-mauve-50">{scope.label}</span>
                  <Label className="normal-case tracking-normal text-[11px]">{kindLabel[scope.kind]}</Label>
                </div>
                <span className={`text-mauve-400 text-lg transition-transform ${isOpen ? "rotate-180" : ""}`}>⌃</span>
              </button>

              {isOpen && (
                <div className="pb-6">
                  <FileGrid scoopSlug={scope.scoopSlug} search={search} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default MediaPage
