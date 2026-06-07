import { useEffect, useState } from "react"

const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi)$/i

const getEffectivePath = (src: string): string => {
  try {
    const u = new URL(src, "http://x")
    const key = u.searchParams.get("key")
    if (key) return decodeURIComponent(key)
  } catch {}
  return src
}

const isVideoSrc = (src: string) => VIDEO_EXTS.test(getEffectivePath(src).split("?")[0])

const isProxyUrl = (src: string) => src.startsWith("/api/files/")

const toRawUrl = (src: string) => {
  const u = new URL(src, "http://x")
  u.searchParams.set("raw", "1")
  return u.pathname + u.search
}

type Props = {
  src: string
  className?: string
}

const VideoPreview = ({ proxySrc, className }: { proxySrc: string; className: string }) => {
  const [realUrl, setRealUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(toRawUrl(proxySrc))
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.url) setRealUrl(d.url) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [proxySrc])

  if (!realUrl) return null

  return (
    <video
      src={realUrl}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
    />
  )
}

export const MediaPreview = ({ src, className = "w-full h-full object-cover" }: Props) => {
  if (isVideoSrc(src)) {
    if (isProxyUrl(src)) {
      return <VideoPreview proxySrc={src} className={className} />
    }
    return (
      <video src={src} className={className} autoPlay muted loop playsInline disablePictureInPicture />
    )
  }
  return <img src={src} alt="" className={className} />
}
