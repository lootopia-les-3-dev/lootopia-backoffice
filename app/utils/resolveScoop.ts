const fileManagerUrl = () => process.env.FILE_MANAGER_URL ?? "http://localhost:3000"
const apiKey = () => process.env.FILE_MANAGER_API_KEY ?? ""

const headers = () => ({ "x-api-key": apiKey(), "Content-Type": "application/json" })

type Scoop = { id: string; name: string; slug: string }

let cache: Scoop[] | null = null
let cacheAt = 0

const listScoops = async (): Promise<Scoop[]> => {
  // Cache for 60s to avoid hammering the filemanager on every image render
  if (cache && Date.now() - cacheAt < 60_000) return cache
  const res = await fetch(`${fileManagerUrl()}/scoops`, { headers: headers() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`listScoops failed (${res.status}): ${body.slice(0, 200)}`)
  }
  cache = await res.json()
  cacheAt = Date.now()
  return cache!
}

export const resolveScoop = async (nameOrSlug: string): Promise<Scoop> => {
  const scoops = await listScoops()

  // Match by slug first (key already contains the real scoop slug)
  const bySlug = scoops.find((s) => s.slug === nameOrSlug)
  if (bySlug) return bySlug

  // Match by name (logical name like "hunt-my-slug")
  const byName = scoops.find((s) => s.name === nameOrSlug)
  if (byName) return byName

  // Create if not found
  const createRes = await fetch(`${fileManagerUrl()}/scoops`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: nameOrSlug }),
  })
  if (!createRes.ok) {
    const body = await createRes.text()
    throw new Error(`createScoop failed (${createRes.status}): ${body.slice(0, 200)}`)
  }
  const created: Scoop = await createRes.json()
  cache = null // invalidate cache
  return created
}
