import axios from "axios"
import type { LoaderFunction } from "react-router"

export const loader: LoaderFunction = async ({ request, params }) => {
  const { slug, stepId } = params
  try {
    const res = await axios.get(
      `${process.env.API_URL}hunts/${slug}/steps/${stepId}/goto`,
      { headers: { cookie: request.headers.get("cookie") || "" } }
    )
    return Response.json(res.data)
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const error = err?.response?.data?.error ?? "Erreur serveur"
    return Response.json({ error }, { status })
  }
}
