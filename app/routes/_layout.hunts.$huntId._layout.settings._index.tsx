import { X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import Switch from "~/components/utils/Switch"
import { UploadFile } from "~/components/utils/uploadFile"

const Hunt = () => {
  const [switch1, setSwitch1] = useState(false)

  return <div className="flex flex-col gap-8">
    <div className="flex justify-between">
      <h2 className="font-bold text-2xl">Settings</h2>
      <Link to=".." className="p-1 hover:cursor-pointer hover:opacity-100">
        <X className="h-5 w-5" />
      </Link>

    </div>
    <div className="flex flex-col gap-2  justify-center">
      <h4 className="font-bold text-xl">
        Name
      </h4>
      <input type="text" className="w-full border-b border-mauve-300 bg-transparent text-lg px-3 py-2 font-bold focus:outline-none focus:border-purple-500 placeholder:italic placeholder:text-lg placeholder:font-normal" placeholder="Name..." />
    </div>
    <div className="flex flex-col gap-4">
      <h4 className="font-bold text-xl">
        Cover
      </h4>
      <div className="w-1/2">
        <UploadFile accept="image/png, image/jpeg" onFile={() => null} />
      </div>
    </div>
    <div className="flex flex-col gap-4">
      <h4 className="font-bold text-xl">
        Geo Restrictions
      </h4>

      <Switch enabled={switch1} onChange={(value) => setSwitch1(value)} />
    </div>
  </div>
}

export default Hunt
