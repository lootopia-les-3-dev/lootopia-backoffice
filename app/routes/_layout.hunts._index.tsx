import axios from "axios"
import { Plus } from "lucide-react"
import { useState } from "react"
import { redirect, useLoaderData, type LoaderFunction } from "react-router"
import { CreateHuntModal } from "~/components/hunts/CreateHuntModal"
import { HuntCard } from "~/components/hunts/HuntCard"
import type { HuntLight } from "~/types/Hunt"
import type { TeamLight } from "~/types/Team"

export const loader: LoaderFunction = async ({ request }) => {
  const cookie = request.headers.get("cookie") || ""
  const headers = { cookie }

  const [hunts, teams] = await Promise.all([
    axios.get(`${process.env.API_URL}hunts`, { headers })
      .then((res): HuntLight[] => res.data)
      .catch((res) => {
        if (res?.response?.status === 401) {
          throw redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)
        }
        return []
      }),
    axios.get(`${process.env.API_URL}teams`, { headers })
      .then((res): TeamLight[] => res.data)
      .catch(() => [] as TeamLight[]),
  ])

  return { hunts, teams }
}

const Hunt = () => {
  const { hunts, teams } = useLoaderData<typeof loader>()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 p-14">
        <h1 className="text-2xl font-semibold mb-6 text-mauve-900 dark:text-mauve-50">Hunts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hunts?.map((hunt) => <HuntCard key={hunt.slug} hunt={hunt} />)}
          <button
            onClick={() => setCreateOpen(true)}
            className="aspect-video bg-mauve-300 dark:bg-mauve-700 rounded-2xl flex justify-center items-center h-full w-full border-4 border-mauve-400 dark:border-mauve-500 border-dotted hover:border-mauve-500 dark:hover:border-mauve-300 hover:cursor-pointer transition-colors"
          >
            <Plus className="h-10 w-10 text-mauve-500 dark:text-mauve-300" />
          </button>
        </div>
      </main>

      <CreateHuntModal open={createOpen} onClose={() => setCreateOpen(false)} teams={teams} />
    </>
  )
}

export default Hunt
