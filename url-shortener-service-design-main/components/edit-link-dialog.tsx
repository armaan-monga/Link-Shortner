"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/client"
import type { PublicUrl } from "@/lib/types"

function toLocalInput(time: number | null) {
  if (!time) return ""
  const date = new Date(time)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function EditLinkDialog({ link, onClose, onSaved }: { link: PublicUrl | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={link !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {link && <EditForm key={link.id} link={link} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ link, onClose, onSaved }: { link: PublicUrl; onClose: () => void; onSaved: () => void }) {
  const [longUrl, setLongUrl] = useState(link.longUrl)
  const [expiresAt, setExpiresAt] = useState(toLocalInput(link.expiresAt))
  const [clickLimit, setClickLimit] = useState(link.clickLimit?.toString() ?? "")
  const [isActive, setIsActive] = useState(link.isActive)
  const [password, setPassword] = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api(`/api/urls/${link.id}`, {
        method: "PATCH",
        json: {
          longUrl,
          isActive,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          clickLimit: clickLimit || null,
          password: password || undefined,
          removePassword,
        },
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Edit <span className="font-mono">/{link.code}</span></DialogTitle>
        <DialogDescription>The short code stays the same; changes apply to the next click.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-url">Destination</Label>
        <Input id="edit-url" type="url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} className="font-mono text-sm" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-expires">Expires</Label>
          <Input id="edit-expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-limit">Click limit</Label>
          <Input id="edit-limit" type="number" min={1} placeholder="Unlimited" value={clickLimit} onChange={(e) => setClickLimit(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-password">{link.hasPassword ? "New password" : "Add password"}</Label>
        <Input id="edit-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={removePassword} placeholder={link.hasPassword ? "Keep current password" : "No password"} />
        {link.hasPassword && (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={removePassword} onCheckedChange={setRemovePassword} />
            Remove password protection
          </label>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        Link is active
      </label>
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
      </DialogFooter>
    </form>
  )
}
