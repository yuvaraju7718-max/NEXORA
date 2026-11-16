import { useEffect, useState } from 'react'

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw) as Partial<T>
      return { ...(initial as Record<string, unknown>), ...(parsed as Record<string, unknown>) } as T
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
