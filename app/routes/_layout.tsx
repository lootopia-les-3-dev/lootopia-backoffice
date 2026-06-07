import { Outlet, redirect } from "react-router"
import type { LoaderFunction } from "react-router"
import { TopNav } from "~/components/TopNav"
import { rootLoader } from "~/loaders/rootloader"

export const loader: LoaderFunction = async (c) => {
  const url = new URL(c.request.url)
  if (url.pathname === "/") return null

  const { user, signInUrl } = await rootLoader(c)
  if (!user) throw redirect(signInUrl)

  return null
}

const Layout = () => {
  return <div className="h-screen flex flex-col dark:bg-mauve-900 dark:text-mauve-50 text-mauve-900 bg-mauve-50">
    <TopNav />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
}

export default Layout