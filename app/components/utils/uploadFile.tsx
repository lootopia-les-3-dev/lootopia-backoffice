import { useCallback, useState } from "react"

type UploadFileProps = {
  accept?: string
  onFile: (file: File) => void
}

export const UploadFile = ({ accept, onFile }: UploadFileProps) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragging
          ? "border-purple-500 bg-purple-500/10"
          : "border-mauve-400 hover:border-mauve-300"
        }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <p className="text-sm text-mauve-400">
        Glissez un fichier ou <span className="text-purple-500 underline">parcourir</span>
      </p>
    </div>
  )
}
