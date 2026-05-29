import { useEffect, useState } from "react"

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied"; error: string }

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationState>({ status: "idle" })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ status: "denied", error: "Géolocalisation non supportée" })
      return
    }

    setLocation({ status: "requesting" })

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        setLocation({ status: "denied", error: err.message })
      },
      { enableHighAccuracy: true },
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return location
}
