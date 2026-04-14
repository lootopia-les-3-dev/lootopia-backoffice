import axios from "axios"
import type { User } from "~/types/User"

type RootLoaderData = {
  signInUrl: string
  user: User | null
}

export const rootLoader = async (c: Parameters<import("react-router").LoaderFunction>[0]) => {
  const url = new URL(c.request.url)

  const { data: user } = await axios.get(`${url.protocol}//${url.host}/sso/api/auth/me`, {
    headers: {
      cookie: c.request.headers.get("cookie") || "",
    },
    withCredentials: true,
  }).catch((e) => {
    return { data: null }
  })


  const signInUrl = `${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(url.href)}`

  return { signInUrl, user } as RootLoaderData
}