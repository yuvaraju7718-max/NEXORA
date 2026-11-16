import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'glass' | 'ghost' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface RippleMark {
  id: number
  x: number
  y: number
  diameter: number
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'glass', size = 'md', onPointerDown, children, ...rest },
  ref,
) {
  const [ripples, setRipples] = useState<RippleMark[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event)
    const rect = event.currentTarget.getBoundingClientRect()
    const diameter = Math.max(rect.width, rect.height) * 2.2
    const id = Date.now() + Math.random()
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top, diameter },
    ])
    const timer = window.setTimeout(() => {
      setRipples((current) => current.filter((mark) => mark.id !== id))
    }, 720)
    timers.current.push(timer)
  }

  return (
    <button
      ref={ref}
      onPointerDown={handlePointerDown}
      className={cn('btn', `btn-${variant}`, `btn-${size}`, className)}
      {...rest}
    >
      {ripples.map((mark) => (
        <span
          key={mark.id}
          className="ripple"
          style={{
            left: mark.x,
            top: mark.y,
            width: mark.diameter,
            height: mark.diameter,
          }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  )
})
