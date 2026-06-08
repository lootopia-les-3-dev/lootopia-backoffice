import { Link, NavLink, useRouteLoaderData } from "react-router"
import type { rootLoader } from "~/loaders/rootloader"

export const TopNav = () => {
  const loaderData = useRouteLoaderData<typeof rootLoader>("root")
  const { user, signInUrl, profileUrl } = loaderData ?? {}

  return (
    <nav className="flex items-center justify-between text-shadow-mauve-900 dark:text-mauve-50 px-4 py-2 border-b border-mauve-400">
      <div className="flex items-end gap-6">
        <Link to="/" className="flex gap-1 items-end">
          <p className="text-3xl font-medium">Lootopia</p>
          <p className="italic font-light">backoffice</p>
        </Link>
        {user && (
          <div className="flex gap-4 pb-0.5">
            <NavLink
              to="/hunts"
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-mauve-900 dark:text-mauve-50 font-medium" : "text-mauve-500 dark:text-mauve-400 hover:text-mauve-700 dark:hover:text-mauve-200"}`
              }
            >
              Hunts
            </NavLink>
            <NavLink
              to="/teams"
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-mauve-900 dark:text-mauve-50 font-medium" : "text-mauve-500 dark:text-mauve-400 hover:text-mauve-700 dark:hover:text-mauve-200"}`
              }
            >
              Équipes
            </NavLink>
            <NavLink
              to="/media"
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-mauve-900 dark:text-mauve-50 font-medium" : "text-mauve-500 dark:text-mauve-400 hover:text-mauve-700 dark:hover:text-mauve-200"}`
              }
            >
              Médiathèque
            </NavLink>
          </div>
        )}
      </div>
      <div>
        {user ? (
          <Link to={profileUrl || ""} className="h-8 w-8 flex justify-center items-center rounded-full border-2 font-bold">
            {user.firstName.slice(0, 1).toLowerCase()}{user.lastName.slice(0, 1).toLowerCase()}
          </Link>
        ) : (
          <a href={signInUrl ?? "#"}>sign in</a>
        )}
      </div>
    </nav>
  )
}