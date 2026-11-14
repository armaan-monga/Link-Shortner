"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/client"

export function PasswordForm({ code }: { code: string }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const { url } = await api<{ url: string }>(`/api/urls/${encodeURIComponent(code)}/verify`, { method: "POST", json: { password } })
      window.location.assign(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify password.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-lg border border-border bg-card/70 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-3">
        <span className="label-caps text-primary">Protected · /{code}</span>
        <h1 className="font-display text-3xl leading-none tracking-tight">
          LOCKED
          <span className="block text-primary">LINK.</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">Enter the password to continue.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-pass" className="label-caps text-muted-foreground">Password</Label>
        <Input
          id="link-pass"
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error) || undefined}
          className="h-11 bg-background"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="label-caps h-12 text-xs" disabled={pending || !password}>
        {pending ? "Checking…" : "Continue"}
        <ArrowRight aria-hidden />
      </Button>
    </form>
  )
}
