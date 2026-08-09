"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"
import Image from "next/image"

import {
  ImagePlus,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  MAX_MEDIA_BATCH_BYTES,
  MAX_MEDIA_FILES_PER_BATCH,
  getSupportedMediaType,
  validatePropertyMediaFile,
  type SupportedMediaType,
} from "@/lib/properties/media-upload"
import { uploadPropertyImage } from "@/lib/repositories/property-image-repository"

type Props = {
  propertyId: string
}

type SelectedMedia = {
  file: File
  previewUrl: string
  type: SupportedMediaType
}

function revokePreview(media: SelectedMedia) {
  URL.revokeObjectURL(media.previewUrl)
}

export function PropertyImageUpload({ propertyId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const selectedMediaRef = useRef<SelectedMedia[]>([])

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    selectedMediaRef.current = selectedMedia
  }, [selectedMedia])

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach(revokePreview)
    }
  }, [])

  function clearSelection() {
    setSelectedMedia(current => {
      current.forEach(revokePreview)
      return []
    })

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  function removeMedia(previewUrl: string) {
    setSelectedMedia(current => {
      const media = current.find(item => item.previewUrl === previewUrl)

      if (media) {
        revokePreview(media)
      }

      return current.filter(item => item.previewUrl !== previewUrl)
    })
  }

  function selectFiles(fileList: FileList | null) {
    if (!fileList) {
      return
    }

    const files = Array.from(fileList)
    const combinedFiles = [
      ...selectedMedia.map(media => media.file),
      ...files,
    ]

    if (combinedFiles.length > MAX_MEDIA_FILES_PER_BATCH) {
      setError(`Select up to ${MAX_MEDIA_FILES_PER_BATCH} files at a time.`)
      return
    }

    if (
      combinedFiles.reduce((total, file) => total + file.size, 0) >
      MAX_MEDIA_BATCH_BYTES
    ) {
      setError("Keep the total upload size below 250 MB.")
      return
    }

    const validationError = files
      .map(validatePropertyMediaFile)
      .find(Boolean)

    if (validationError) {
      setError(validationError)
      return
    }

    const nextMedia = files.flatMap(file => {
      const type = getSupportedMediaType(file)

      return type
        ? [{
            file,
            type,
            previewUrl: URL.createObjectURL(file),
          }]
        : []
    })

    setError("")
    setSelectedMedia(current => [...current, ...nextMedia])

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  async function upload() {
    if (selectedMedia.length === 0 || uploading) {
      return
    }

    const uploadQueue = [...selectedMedia]
    setUploading(true)
    setError("")

    try {
      for (const [index, media] of uploadQueue.entries()) {
        setUploadStatus(`Uploading ${index + 1} of ${uploadQueue.length}…`)
        await uploadPropertyImage(propertyId, media.file)

        setSelectedMedia(current => {
          const uploaded = current.find(
            item => item.previewUrl === media.previewUrl
          )

          if (uploaded) {
            revokePreview(uploaded)
          }

          return current.filter(
            item => item.previewUrl !== media.previewUrl
          )
        })
      }

      setUploadStatus("")
      router.refresh()
    } catch (uploadError) {
      console.error("Media upload failed", uploadError)
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Media upload failed. Your remaining files are still selected."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
        multiple
        hidden
        onChange={event => selectFiles(event.target.files)}
      />

      {selectedMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {selectedMedia.map((media, index) => (
            <div
              key={media.previewUrl}
              className="relative aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              {media.type === "video" ? (
                <video
                  src={media.previewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={media.previewUrl}
                  alt={`Selected property media ${index + 1}`}
                  width={320}
                  height={320}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              )}

              <button
                type="button"
                aria-label={`Remove ${media.file.name}`}
                disabled={uploading}
                onClick={() => removeMedia(media.previewUrl)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Select photos or videos
        </Button>

        {selectedMedia.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedMedia.length} of {MAX_MEDIA_FILES_PER_BATCH} selected
          </p>
        )}

        {selectedMedia.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={clearSelection}
          >
            Clear
          </Button>
        )}

        <Button
          type="button"
          className="w-full sm:ml-auto sm:w-auto"
          onClick={upload}
          disabled={uploading || selectedMedia.length === 0}
        >
          {uploading
            ? uploadStatus || "Uploading…"
            : "Upload media"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP or AVIF up to 12 MB each. MP4, WebM or MOV up to
        75 MB each. Uploads run one at a time to stay reliable on mobile.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
