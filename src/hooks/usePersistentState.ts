import { useEffect, useState } from 'react'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw) as T
      // Objects are merged so new default fields appear; arrays and primitives
      // replace wholesale so callers always get the shape they asked for.
      if (isPlainObject(initial) && isPlainObject(parsed)) {
        return { ...initial, ...parsed } as T
      }
      if (Array.isArray(initial)) {
        return (Array.isArray(parsed) ? parsed : initial) as T
      }
      return parsed ?? initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value])

  return [value, setValue] as const
}
