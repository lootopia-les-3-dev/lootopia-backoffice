import { Users } from "lucide-react"
import { Link } from "react-router"
import type { TeamLight } from "~/types/Team"

export const TeamCard = ({ team }: { team: TeamLight }) => (
  <Link
    to={`/teams/${encodeURIComponent(team.slug)}`}
    className="bg-mauve-300 dark:bg-mauve-700 rounded-2xl shadow p-6 flex flex-col gap-3 hover:bg-mauve-400 dark:hover:bg-mauve-600 transition-colors"
  >
    <div className="w-10 h-10 rounded-full bg-mauve-200 dark:bg-mauve-600 flex items-center justify-center">
      <Users size={20} className="text-mauve-600 dark:text-mauve-300" />
    </div>
    <p className="font-medium text-mauve-900 dark:text-mauve-50">{team.name}</p>
  </Link>
)
