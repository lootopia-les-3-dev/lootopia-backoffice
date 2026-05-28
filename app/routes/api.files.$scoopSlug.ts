import type { ActionFunction, LoaderFunction } from "react-router"
import { resolveScoop } from "~/utils/resolveScoop"

const fileManagerUrl = () => process.env.FILE_MANAGER_URL ?? "http://localhost:3000"
const apiKey = () => process.env.FILE_MANAGER_API_KEY ?? ""

const safeJson = async (res: Response) => {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { error: text } }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const { scoopSlug } = params as { scoopSlug: string }
  const url = new URL(request.url)
  const path = url.searchParams.get("path") ?? ""

  const scoop = await resolveScoop(scoopSlug)
  const target = `${fileManagerUrl()}/files/${scoop.slug}${path ? `?path=${encodeURIComponent(path)}` : ""}`

  const res = await fetch(target, {
    headers: { "x-api-key": apiKey() },
  })

  const data = await safeJson(res)
  return Response.json(data, { status: res.status })
}

export const action: ActionFunction = async ({ request, params }) => {
  const { scoopSlug } = params as { scoopSlug: string }

  if (request.method === "POST") {
    const formData = await request.formData()

    const scoop = await resolveScoop(scoopSlug)
    const target = `${fileManagerUrl()}/files/${scoop.slug}/upload`

    const res = await fetch(target, {
      method: "POST",
      body: formData,
      headers: { "x-api-key": apiKey() },
    })

    const data = await safeJson(res)
    return Response.json(data, { status: res.status })
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 })
}
