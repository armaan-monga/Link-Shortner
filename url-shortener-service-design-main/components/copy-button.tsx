"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ value, label = "Copy", size = "sm" }: { value: string; label?: string; size?: "sm" | "default" | "lg" | "icon-sm" }) {
  const [copied, setCopied] = useState(false)
  const iconOnly = size === "icon-sm"
  return (
    <Button
      variant={iconOnly ? "ghost" : "default"}
      size={size}
      aria-label={iconOnly ? `Copy ${value}` : undefined}
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {!iconOnly && (copied ? "Copied" : label)}
      <span className="sr-only" aria-live="polite">{copied ? "Copied to clipboard" : ""}</span>
    </Button>
  )
}
