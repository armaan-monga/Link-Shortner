"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/client"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isLogin = mode === "login"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    try {
      await api(`/api/auth/${mode}`, { method: "POST", json: { email: form.get("email"), password: form.get("password") } })
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-card/70 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-3">
        <span className="label-caps text-primary">{isLogin ? "Welcome back" : "New account"}</span>
        <h1 className="font-display text-3xl leading-none tracking-tight">
          {isLogin ? "SIGN" : "JOIN"}
          <span className="block text-primary">{isLogin ? "IN." : "SNIP."}</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{isLogin ? "Manage links and view analytics." : "Save links and track every click."}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="label-caps text-muted-foreground">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={isLogin ? "demo@snip.dev" : ""} className="h-11 bg-background" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="label-caps text-muted-foreground">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={8}
          required
          defaultValue={isLogin ? "demo1234" : ""}
          className="h-11 bg-background"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="label-caps h-12 text-xs" disabled={pending}>
        {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        <ArrowRight aria-hidden />
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "No account? " : "Already registered? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary underline-offset-4 hover:underline">
          {isLogin ? "Create one" : "Sign in"}
        </Link>
      </p>
    </form>
  )
}
