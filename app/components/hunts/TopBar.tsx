import { Loader, Settings, Wifi, WifiOff } from "lucide-react"
import { Link, useRouteLoaderData } from "react-router"
import type { rootLoader } from "~/loaders/rootloader"
import type { HuntLight } from "~/types/Hunt"

const StatusIcon = ({ connection }: { connection: string }) => {
  if (connection === "open") return <Wifi size={14} className="text-green-400" />
  if (connection === "connecting") return <Loader size={14} className="text-yellow-400 animate-spin" />
  return <WifiOff size={14} className="text-red-400" />
}

type Props = {
  hunt: HuntLight | null
  connection: string
  nodeCount: number
  maxNodes: number
}

export const HuntTopBar = ({ connection, hunt, nodeCount, maxNodes }: Props) => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root")
  const shopUrl = hunt?.slug ? `${rootData?.shopUrl}/${hunt.slug}` : rootData?.shopUrl ?? ""

  const isAtMax = nodeCount >= maxNodes

  return (
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

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-0.5">
          <span className={`text-sm font-medium tabular-nums ${isAtMax ? "text-red-400" : "text-mauve-200"}`}>
            {nodeCount} / {maxNodes} <span className="font-normal text-mauve-400">nodes</span>
          </span>
          {shopUrl && (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-mauve-400 hover:text-mauve-200 transition-colors"
            >
              Ajouter des nodes
            </a>
          )}
        </div>
        <Link to="settings" className="p-1 border border-mauve-50 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  )
}
