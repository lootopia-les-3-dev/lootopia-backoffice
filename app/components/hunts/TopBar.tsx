import { Settings } from "lucide-react"
import { Link } from "react-router"

export const HuntTopBar = ({ connection }: { connection: string }) => <nav className="flex text-mauve-50 px-4 py-2 justify-between">
  <div className="flex items-center gap-2">
    <h1 className="text-lg font-bold">Hunt Name</h1>
    <p className="text-lg font-light">by <span className="underline">placeholder</span></p>
    <p>{connection}</p>
  </div>
  <div className="flex">
    <Link to="settings" className="p-1 border border-mauve-50 rounded-sm opacity-70 hover:cursor-pointer hover:opacity-100">
      <Settings className="h-4 w-4" />
    </Link>
  </div>
</nav>