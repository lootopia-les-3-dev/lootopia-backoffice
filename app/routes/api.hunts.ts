import axios from "axios"
import type { ActionFunction } from "react-router"

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const body = await request.json()

  try {
    const res = await axios.post(`${process.env.API_URL}hunts`, body, {
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
