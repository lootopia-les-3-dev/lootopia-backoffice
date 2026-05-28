const fileManagerUrl = () => process.env.FILE_MANAGER_URL ?? "http://localhost:3000"
const apiKey = () => process.env.FILE_MANAGER_API_KEY ?? ""

const headers = () => ({ "x-api-key": apiKey(), "Content-Type": "application/json" })

type Scoop = { id: string; name: string; slug: string }

export const resolveScoop = async (name: string): Promise<Scoop> => {
  const listRes = await fetch(`${fileManagerUrl()}/scoops`, { headers: headers() })
  const scoops: Scoop[] = await listRes.json()

  const existing = scoops.find((s) => s.name === name)
  if (existing) return existing

  const createRes = await fetch(`${fileManagerUrl()}/scoops`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name }),
  })

  return createRes.json()
}
