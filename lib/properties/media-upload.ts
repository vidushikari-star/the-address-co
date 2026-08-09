export const MAX_MEDIA_FILES_PER_BATCH = 10
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024
export const MAX_VIDEO_BYTES = 75 * 1024 * 1024
export const MAX_MEDIA_BATCH_BYTES = 250 * 1024 * 1024

const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

const videoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

export type SupportedMediaType = "image" | "video"

export function getSupportedMediaType(
  file: Pick<File, "type">
): SupportedMediaType | null {
  if (imageTypes.has(file.type)) {
    return "image"
  }

  if (videoTypes.has(file.type)) {
    return "video"
  }

  return null
}

export function validatePropertyMediaFile(
  file: Pick<File, "name" | "size" | "type">
) {
  const mediaType = getSupportedMediaType(file)

  if (!mediaType) {
    return `${file.name} is not a supported media format.`
  }

  const maxSize =
    mediaType === "image"
      ? MAX_IMAGE_BYTES
      : MAX_VIDEO_BYTES

  if (file.size > maxSize) {
    const limit = mediaType === "image" ? "12 MB" : "75 MB"
    return `${file.name} exceeds the ${limit} limit.`
  }

  return null
}
