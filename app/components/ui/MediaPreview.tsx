const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi)$/i

type Props = {
  src: string
  className?: string
}

export const MediaPreview = ({ src, className = "w-full h-full object-cover" }: Props) => {
  if (VIDEO_EXTS.test(src.split("?")[0])) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
      />
    )
  }
  return <img src={src} alt="" className={className} />
}
