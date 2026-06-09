import { redirect, type LoaderFunction } from "react-router"
import { rootLoader } from "~/loaders/rootloader"

export const loader: LoaderFunction = async (c) => {
  const { user } = await rootLoader(c)

  if (user) {
    return redirect("/hunts")
  }
  else {
    return redirect(process.env.SSO_URL ? `${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(c.request.url)}` : "/hunts")
  }
}

const Home = () => <>
  Home
</>

export default Home