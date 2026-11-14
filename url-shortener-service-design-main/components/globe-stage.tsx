"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { GlobeCanvasProps } from "@/components/globe-canvas"

const GlobeCanvas = dynamic(() => import("@/components/globe-canvas"), { ssr: false })

type GlobeStageProps = Omit<GlobeCanvasProps, "width" | "height"> & { className?: string }

export function GlobeStage({ className, ...props }: GlobeStageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {size.width > 0 && size.height > 0 && <GlobeCanvas {...props} {...size} />}
    </div>
  )
}
