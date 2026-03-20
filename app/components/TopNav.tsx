import { Link, useRouteLoaderData } from "react-router"
import type { rootLoader } from "~/loaders/rootloader"
import { formatSSOUrl } from "~/utils/auth/formatSSOUrl"

export const TopNav = () => {
  const loaderData = useRouteLoaderData<typeof rootLoader>("root")
  const env = loaderData?.env
  const user = loaderData?.user

  return <nav className="flex justify-between text-shadow-mauve-900 dark:text-mauve-50 px-4 py-2 border-b border-mauve-400">
    <div>
      <Link to="/" className="flex gap-1 items-end">
        <p className="text-3xl font-medium">Lootopia</p>
        <p className="italic font-light">backoffice</p>
      </Link>
    </div>
    <div>
      {
        user ? <div className="h-8 w-8 flex justify-center items-center rounded-full border-2 font-bold">
          {user.firstName.slice(0, 1).toLowerCase()}{user.lastName.slice(0, 1).toLowerCase()}
        </div>
          :
          <a href={formatSSOUrl(env?.SSO_URL ?? "")}>
            sign in
          </a>
      }
    </div>

  </nav>
}