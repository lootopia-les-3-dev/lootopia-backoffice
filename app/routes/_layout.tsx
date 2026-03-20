import { Outlet } from "react-router"
import { TopNav } from "~/components/TopNav"


const Layout = () => {
  return <div className="h-screen flex flex-col dark:bg-mauve-900 dark:text-mauve-50 text-mauve-900 bg-mauve-50">
    <TopNav />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
}

export default Layout