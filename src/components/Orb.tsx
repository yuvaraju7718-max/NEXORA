import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { OrbState } from '../types'
import { cn } from '../lib/cn'

export function Orb({
  state,
  size = 260,
  float = true,
  className,
}: {
  state: OrbState
  size?: number
  float?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const style = { '--orb-size': `${size}px` } as CSSProperties
  const animate = float && !reduceMotion ? { y: [0, -10, 0] } : undefined

  return (
    <motion.div
      className={cn('orb', size < 70 && 'orb-mini', className)}
      data-state={state}
      style={style}
      animate={animate}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <div className="orb-aura" />
      <div className="orb-sphere">
        <div className="orb-conic" />
        <div className="orb-core" />
        <div className="orb-caustic" />
        <div className="orb-sheen" />
        <div className="orb-rim" />
        <div className="orb-spec" />
      </div>
      <div className="orb-shadow" />
    </motion.div>
  )
}
