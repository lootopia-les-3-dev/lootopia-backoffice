import axios from "axios"
import type { User } from "~/types/User"

type RootLoaderData = {
  signInUrl: string
  user: User | null
  socketUrl: string
  mapboxToken: string
  shopUrl: string
}

export const rootLoader = async (c: Parameters<import("react-router").LoaderFunction>[0]) => {
  const url = new URL(c.request.url)

  const { data: user } = await axios.get(`${process.env.SSO_URL}/api/auth/me`, {
    headers: {
      cookie: c.request.headers.get("cookie") || "",
    },
    withCredentials: true,
  }).catch((_e) => {
    return { data: null }
  })


  const signInUrl = `${process.env.SSO_URL}/login?callbackUrl=${encodeURIComponent(url.href)}`
  const socketUrl = process.env.SOCKET_URL || ""
  const mapboxToken = process.env.MAPBOX_TOKEN || ""
  const shopUrl = process.env.SHOP_URL || ""

  return { signInUrl, user, socketUrl, mapboxToken, shopUrl } as RootLoaderData
}