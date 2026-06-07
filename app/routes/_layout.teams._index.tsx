import axios from "axios"
import { Plus } from "lucide-react"
import { useState } from "react"
import { redirect, useLoaderData, useRevalidator, type LoaderFunction } from "react-router"
import { TeamCard } from "~/components/teams/TeamCard"
import { CreateTeamModal } from "~/components/teams/CreateTeamModal"
import type { TeamLight } from "~/types/Team"

export const loader: LoaderFunction = async ({ request }) => {
  const teams = await axios.get(`${process.env.API_URL}teams`, {
    headers: { cookie: request.headers.get("cookie") || "" },
  })
    .then((res): TeamLight[] => res.data)
    .catch((err) => {
      if (err?.response?.status === 401) {
        throw redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)
      }
      return [] as TeamLight[]
    })

  return teams
}

const Teams = () => {
  const teams = useLoaderData<typeof loader>()
  const { revalidate } = useRevalidator()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <main className="h-full w-full flex flex-col bg-mauve-200 dark:bg-mauve-600 p-14">
        <h1 className="text-2xl font-semibold mb-6 text-mauve-900 dark:text-mauve-50">Équipes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teams?.map((team) => <TeamCard key={team.slug} team={team} />)}
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-2xl flex justify-center items-center h-32 w-full border-4 border-mauve-400 dark:border-mauve-500 border-dotted hover:border-mauve-500 dark:hover:border-mauve-300 bg-mauve-300 dark:bg-mauve-700 hover:cursor-pointer transition-colors"
          >
            <Plus className="h-10 w-10 text-mauve-500 dark:text-mauve-300" />
          </button>
        </div>
      </main>

      <CreateTeamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={revalidate}
      />
    </>
  )
}

export default Teams
