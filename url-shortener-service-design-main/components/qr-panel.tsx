"use client"

import { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QrPanel({ value, code, size = 148 }: { value: string; code: string; size?: number }) {
  const wrapper = useRef<HTMLDivElement>(null)

  function download() {
    const canvas = wrapper.current?.querySelector("canvas")
    if (!canvas) return
    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = `snip-${code}.png`
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrapper} className="rounded-md bg-primary p-3 shadow-lg shadow-primary/10">
        <QRCodeCanvas value={value} size={size} marginSize={0} fgColor="#070707" bgColor="#c8ff3d" level="M" title={`QR code for ${value}`} />
      </div>
      <Button variant="ghost" size="sm" className="label-caps text-muted-foreground hover:text-primary" onClick={download}>
        <Download aria-hidden />
        Download PNG
      </Button>
    </div>
  )
}
