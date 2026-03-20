import { ChartPie, GitGraph, UserRound } from "lucide-react"
import { Link, type To } from "react-router"

export const SideBar = () => <aside className="text-mauve-50 text-x font-light">
  <nav>
    <ul className="flex flex-col gap-4">
      <li>
        <SideBarItem icon={<GitGraph />} to="." />
      </li>
      <li>
        <SideBarItem icon={<UserRound />} to="users" />
      </li>
      <li>
        <SideBarItem icon={<ChartPie />} to="stats" />
      </li>
    </ul>
  </nav>
</aside>

const SideBarItem = ({ icon, to }: { icon: React.ReactNode, to: To }) =>
  <Link to={to} className="flex items-center gap-2 p-1">
    {icon}
  </Link>
