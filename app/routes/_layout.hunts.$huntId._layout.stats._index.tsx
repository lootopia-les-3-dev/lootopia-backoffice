import { X } from "lucide-react"
import { Link } from "react-router"

const Hunt = () => {
  return <>
    <div className="flex justify-between">
      <h2 className="font-bold text-2xl">Stats</h2>
      <Link to=".." className="p-1 hover:cursor-pointer hover:opacity-100">
        <X className="h-5 w-5" />
      </Link>
    </div>
  </>
}

export default Hunt
