import { Loader, Settings, Wifi, WifiOff } from "lucide-react"
import { Link } from "react-router"
import type { HuntLight } from "~/types/Hunt"

const StatusIcon = ({ connection }: { connection: string }) => {
  if (connection === "open") return <Wifi size={14} className="text-green-400" />
  if (connection === "connecting") return <Loader size={14} className="text-yellow-400 animate-spin" />
  return <WifiOff size={14} className="text-red-400" />
}

export const HuntTopBar = ({ connection, hunt }: { connection: string; hunt: HuntLight | null }) => (
  <nav className="flex text-mauve-50 px-4 py-2 justify-between items-center">
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-bold truncate max-w-64">{hunt?.name ?? "..."}</h1>
      {hunt?.createdBy && (
        <p className="text-sm font-light text-mauve-300">
          par <span className="text-mauve-100">{hunt.createdBy.firstName} {hunt.createdBy.lastName}</span>
        </p>
      )}
      {hunt?.teamSlug && (
        <p className="text-sm font-light text-mauve-300">
          · équipe <Link to={`/teams/${hunt.teamSlug}`} className="text-mauve-100 underline hover:text-mauve-50 transition-colors">{hunt.teamSlug}</Link>
        </p>
      )}
      <StatusIcon connection={connection} />
    </div>
    <Link to="settings" className="p-1 border border-mauve-50 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
      <Settings className="h-4 w-4" />
    </Link>
  </nav>
)
