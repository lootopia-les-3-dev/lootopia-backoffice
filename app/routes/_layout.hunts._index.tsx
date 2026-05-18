import axios from "axios"
import { Plus } from "lucide-react"
import { redirect, useLoaderData, type LoaderFunction } from "react-router"
import { HuntCard } from "~/components/hunts/HuntCard"
import type { HuntLight } from "~/types/Hunt"

export const loader: LoaderFunction = async ({ request }) => {
  const hunts = await axios.get(`${process.env.API_URL}hunts`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  })
    .then((res): HuntLight[] => res.data)
    .catch(() => null).catch((res) => {
      console.error("Failed to fetch hunts", res)
      if (res.response.status === 401) {
        redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)
      }
      return null
    })

  return hunts
}


const Hunt = () => {
  const hunts = useLoaderData<typeof loader>()

  return <>
    <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 p-14">
      <h1>Hunts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {hunts?.map((hunt) => <HuntCard key={hunt.id} hunt={hunt} />)}
        <button className="aspect-video bg-mauve-300 rounded-2xl flex justify-center items-center h-full w-full border-4 border-mauve-400 border-dotted hover:cursor-pointer">
          <Plus className="h-10 w-10 text-mauve-500" />
        </button>
      </div>
    </main >
  </>
}

export default Hunt