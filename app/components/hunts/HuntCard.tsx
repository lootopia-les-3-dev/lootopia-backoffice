import { FileImage } from "lucide-react"
import { Link } from "react-router"
import type { HuntLight } from "~/types/Hunt"

export const HuntCard = ({ hunt }: { hunt: HuntLight }) => (
  <Link to={"/hunts/" + encodeURIComponent(hunt.slug)} className="bg-mauve-400 aspect-video rounded-2xl shadow overflow-hidden flex flex-col">
    <div className="h-full w-full">
      {hunt.cover ?
        <></>
        :
        <div className="w-full h-full bg-mauve-300 flex justify-center items-center">
          <FileImage className="h-10 w-10 text-mauve-500" />
        </div>
      }
    </div>
    <p className="p-4">{hunt.name}</p>
  </Link>
)