"use client"

import { useSyncExternalStore } from "react"

const dirtyByContentId = new Map<string, boolean>()
const listeners = new Set<() => void>()

export function setStoryCreativeDirty(contentId: string, dirty: boolean) {
  if (dirtyByContentId.get(contentId) === dirty) return
  dirtyByContentId.set(contentId, dirty)
  listeners.forEach(listener => listener())
}

export function useStoryCreativeDirty(contentId: string) {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => dirtyByContentId.get(contentId) ?? false,
    () => false,
  )
}
