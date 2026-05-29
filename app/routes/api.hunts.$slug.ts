import axios from "axios"
import type { ActionFunction } from "react-router"

export const action: ActionFunction = async ({ request, params }) => {
  const { slug } = params

  if (request.method === "PATCH") {
    const body = await request.json()
    try {
      const res = await axios.patch(`${process.env.API_URL}hunts/${slug}`, body, {
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

  if (request.method === "DELETE") {
    try {
      await axios.delete(`${process.env.API_URL}hunts/${slug}`, {
        headers: { cookie: request.headers.get("cookie") || "" },
      })
      return Response.json({ success: true })
    } catch (err: any) {
      const status = err?.response?.status ?? 500
      const error = err?.response?.data?.error ?? "Erreur serveur"
      return Response.json({ error }, { status })
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 })
}
