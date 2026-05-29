import { FileImage } from "lucide-react"
import { Link } from "react-router"
import { MediaPreview } from "~/components/ui/MediaPreview"
import type { HuntLight } from "~/types/Hunt"

export const HuntCard = ({ hunt }: { hunt: HuntLight }) => (
  <Link to={"/hunts/" + encodeURIComponent(hunt.slug)} className="bg-mauve-300 dark:bg-mauve-700 aspect-video rounded-2xl shadow overflow-hidden flex flex-col group">
    <div className="flex-1 w-full overflow-hidden">
      {hunt.coverKey ? (
        <MediaPreview
          src={`/api/files/hunt-${hunt.slug}/url?key=${encodeURIComponent(hunt.coverKey)}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-mauve-200 dark:bg-mauve-600 flex justify-center items-center">
          <FileImage className="h-10 w-10 text-mauve-400 dark:text-mauve-500" />
        </div>
      )}
    </div>
    <p className="px-4 py-3 text-sm font-medium text-mauve-900 dark:text-mauve-50 truncate">{hunt.name}</p>
  </Link>
)