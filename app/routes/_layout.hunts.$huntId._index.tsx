import { HuntCanvasGaph } from "~/components/hunts/graph/HuntCanvasGaph"
import { SideBar } from "~/components/hunts/SideBar"
import { HuntTopBar } from "~/components/hunts/TopBar"

const Hunt = () => {
  return <>
    <main className="h-full w-full flex flex-col bg-mauve-400 dark:bg-mauve-600">
      <HuntTopBar />
      <div className="flex flex-1 p-4 gap-2 pt-0 pl-2">
        <SideBar />
        <section className="h-full w-full bg-mauve-200 dark:bg-mauve-900 rounded-xl">
          <HuntCanvasGaph />

        </section>
      </div>
    </main >
  </>
}

export default Hunt