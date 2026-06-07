import axios from "axios"
import type { ActionFunction } from "react-router"

export const action: ActionFunction = async ({ request, params }) => {
  const { slug } = params
  const body = await request.json()
  const method = request.method

  if (!["POST", "DELETE", "PATCH"].includes(method)) {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const res = await axios({
      method: method.toLowerCase() as "post" | "delete" | "patch",
      url: `${process.env.API_URL}teams/${slug}/members`,
      data: body,
      headers: {
        cookie: request.headers.get("cookie") || "",
        "Content-Type": "application/json",
      },
    })
    return Response.json(res.data, { status: 200 })
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const error = err?.response?.data?.error ?? "Erreur serveur"
    return Response.json({ error }, { status })
  }
}
