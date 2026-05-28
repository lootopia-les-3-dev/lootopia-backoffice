import type { LoaderFunction } from "react-router"
import { resolveScoop } from "~/utils/resolveScoop"

export const loader: LoaderFunction = async ({ request, params }) => {
  const { scoopSlug } = params as { scoopSlug: string }
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  const expires = url.searchParams.get("expires") ?? "3600"

  if (!key) return Response.json({ error: "key is required" }, { status: 400 })

  const fileManagerUrl = process.env.FILE_MANAGER_URL ?? "http://localhost:3000"
  const apiKey = process.env.FILE_MANAGER_API_KEY ?? ""

  const scoop = await resolveScoop(scoopSlug)
  const target = `${fileManagerUrl}/files/${scoop.slug}/url?key=${encodeURIComponent(key)}&expires=${expires}`

  const res = await fetch(target, { headers: { "x-api-key": apiKey } })
  const text = await res.text()

  let signedUrl: string | undefined
  try { signedUrl = JSON.parse(text)?.url } catch { signedUrl = undefined }

  if (!signedUrl) return Response.json({ error: "Failed to get URL" }, { status: 502 })

  return Response.redirect(signedUrl, 302)
}
