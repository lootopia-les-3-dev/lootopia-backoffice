import { FileImage, FolderOpen, Upload, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Label } from "~/components/ui/Label"

export type MediaScope =
  | { type: "user"; userId: string }
  | { type: "team"; teamSlug: string }
  | { type: "hunt"; huntSlug: string }

type FileItem = {
  key: string
  type: "file" | "folder"
  size?: number
  relativePath: string
}

type TabKey = "hunt" | "team" | "user"

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (key: string) => void
  scopes: {
    hunt?: { huntSlug: string }
    team?: { teamSlug: string }
    user?: { userId: string }
  }
  defaultTab?: TabKey
}

const scoopSlug = (scope: MediaScope): string => {
  if (scope.type === "user") return `user-${scope.userId}`
  if (scope.type === "team") return `team-${scope.teamSlug}`
  return `hunt-${scope.huntSlug}`
}

const formatSize = (bytes?: number) => {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|svg|avif)$/i

const useFiles = (slug: string | null) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/files/${slug}`)
      if (res.ok) setFiles(await res.json())
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  return { files, loading, reload: load }
}

type TabPanelProps = {
  slug: string
  onSelect: (key: string) => void
}

const TabPanel = ({ slug, onSelect }: TabPanelProps) => {
  const { files, loading, reload } = useFiles(slug)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch(`/api/files/${slug}`, { method: "POST", body: fd })
      if (res.ok) await reload()
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi)$/i
  const mediaFiles = files.filter((f) => f.type === "file" && (IMAGE_EXTS.test(f.relativePath) || VIDEO_EXTS.test(f.relativePath)))
  const otherFiles = files.filter((f) => f.type === "file" && !IMAGE_EXTS.test(f.relativePath) && !VIDEO_EXTS.test(f.relativePath))

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-sm
          ${dragOver
            ? "border-purple-500 bg-purple-500/10 text-purple-500"
            : "border-mauve-300 dark:border-mauve-600 text-mauve-400 hover:border-mauve-400 dark:hover:border-mauve-400"
          }`}
      >
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleInput} />
        <Upload size={16} />
        <span>{uploading ? "Upload en cours..." : "Glisser ou cliquer pour uploader"}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-mauve-400">Chargement...</div>
      ) : mediaFiles.length === 0 && otherFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-mauve-400">
          <FolderOpen size={32} />
          <span className="text-sm">Aucun fichier</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {mediaFiles.length > 0 && (
            <>
              <Label className="mb-2 block">Médias</Label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {mediaFiles.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onSelect(f.key)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-mauve-100 dark:bg-mauve-700 border-2 border-transparent hover:border-purple-500 transition-colors"
                  >
                    {VIDEO_EXTS.test(f.relativePath) ? (
                      <video
                        src={`/api/files/${slug}/url?key=${encodeURIComponent(f.key)}`}
                        className="w-full h-full object-cover"
                        autoPlay muted loop playsInline disablePictureInPicture
                      />
                    ) : (
                      <img
                        src={`/api/files/${slug}/url?key=${encodeURIComponent(f.key)}`}
                        alt={f.relativePath}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/50 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.relativePath}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {otherFiles.length > 0 && (
            <>
              <Label className="mb-2 block">Autres fichiers</Label>
              <div className="flex flex-col gap-1">
                {otherFiles.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onSelect(f.key)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-mauve-100 dark:bg-mauve-700 hover:bg-mauve-200 dark:hover:bg-mauve-600 text-left transition-colors"
                  >
                    <FileImage size={16} className="text-mauve-400 shrink-0" />
                    <span className="text-sm truncate text-mauve-800 dark:text-mauve-100">{f.relativePath}</span>
                    {f.size !== undefined && (
                      <span className="ml-auto text-xs text-mauve-400 shrink-0">{formatSize(f.size)}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export const MediaPicker = ({ open, onClose, onSelect, scopes, defaultTab }: Props) => {
  const tabs: { key: TabKey; label: string; slug: string }[] = []

  if (scopes.hunt) tabs.push({ key: "hunt", label: "Hunt", slug: `hunt-${scopes.hunt.huntSlug}` })
  if (scopes.team) tabs.push({ key: "team", label: "Équipe", slug: `team-${scopes.team.teamSlug}` })
  if (scopes.user) tabs.push({ key: "user", label: "Personnel", slug: `user-${scopes.user.userId}` })

  const firstTab = defaultTab && tabs.find((t) => t.key === defaultTab) ? defaultTab : tabs[0]?.key
  const [activeTab, setActiveTab] = useState<TabKey | undefined>(firstTab)

  useEffect(() => {
    if (open) setActiveTab(firstTab)
  }, [open])

  if (!open || tabs.length === 0) return null

  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl h-[600px] bg-mauve-50 dark:bg-mauve-800 border border-mauve-200 dark:border-mauve-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-semibold text-mauve-900 dark:text-mauve-50">Médiathèque</h2>
          <button onClick={onClose} className="text-mauve-400 hover:text-mauve-600 dark:hover:text-mauve-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 px-5 pb-3 shrink-0 border-b border-mauve-200 dark:border-mauve-600">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? "bg-mauve-900 dark:bg-mauve-50 text-mauve-50 dark:text-mauve-900"
                    : "text-mauve-500 dark:text-mauve-400 hover:bg-mauve-100 dark:hover:bg-mauve-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Panel */}
        <div className="flex-1 overflow-hidden px-5 py-4">
          {currentTab && (
            <TabPanel
              key={currentTab.slug}
              slug={currentTab.slug}
              onSelect={(key) => { onSelect(key); onClose() }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
