import axios from "axios"
import { Outlet, redirect, useLoaderData, useRouteLoaderData, type LoaderFunction } from "react-router"
import { HuntCanvasGaph } from "~/components/hunts/graph/HuntCanvasGaph"
import { SideBar } from "~/components/hunts/SideBar"
import { HuntTopBar } from "~/components/hunts/TopBar"
import { useHuntManager } from "~/hooks/huntManagerHook"
import { HuntManagerProvider } from "~/hooks/HuntManagerProvider"
import type { HuntLight } from "~/types/Hunt"

type LoaderData = {
  hunt: HuntLight | null
  slug: string
}

export const loader: LoaderFunction = async ({ params, request }): Promise<LoaderData> => {
  const { huntId } = params

  const hunt = await axios.get<HuntLight[]>(`${process.env.API_URL}hunts`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  })
    .then((res) => res.data.filter((hunt) => hunt.slug === huntId)[0])
    .catch((res) => {
      if (res.response?.status === 401) {
        throw redirect(`${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(request.url)}`)
      }
      return null
    })

  return {
    hunt,
    slug: huntId || "",
  }
}


const DEFAULT_MAX_STEPS = 20

const HuntLayout = () => {
  const { status, huntState } = useHuntManager()
  const { hunt } = useRouteLoaderData<() => LoaderData>("routes/_layout.hunts.$huntId._layout") ?? { hunt: null }

  const maxNodes = hunt?.maxNodes ?? DEFAULT_MAX_STEPS
  const nodeCount = huntState?.steps.length ?? 0

  return (
    <main className="h-[calc(100vh-53px)] w-full flex flex-col bg-mauve-400 dark:bg-mauve-600">
      <HuntTopBar hunt={hunt} connection={status} nodeCount={nodeCount} maxNodes={maxNodes} />
      <div className="flex min-h-0 flex-1 p-4 gap-2 pt-0 pl-2">
        <SideBar />
        <section className="min-h-0 w-full hidden md:flex bg-mauve-200 dark:bg-mauve-900 rounded-xl">
          <HuntCanvasGaph maxNodes={maxNodes} />
        </section>
        <section className="min-h-0 w-full flex flex-col bg-mauve-200 dark:bg-mauve-900 rounded-xl p-8 overflow-y-auto">
          <Outlet />
        </section>
      </div>
    </main>
  )
}

const Hunt = () => {
  const { slug } = useLoaderData<() => LoaderData>()

  return (
    <HuntManagerProvider slug={slug ?? ""}>
      <HuntLayout />
    </HuntManagerProvider>
  )
}

export default Hunt
