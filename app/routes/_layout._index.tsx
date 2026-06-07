import { redirect, type LoaderFunction } from "react-router"
import { rootLoader } from "~/loaders/rootloader"

export const loader: LoaderFunction = async (c) => {
  const { user } = await rootLoader(c)

  if (user) {
    return redirect("/hunts")
  }
}

const Home = () => <>
  Home
</>

export default Home