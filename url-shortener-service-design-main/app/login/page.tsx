import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AuthShell } from "@/components/auth-shell"
import { AuthForm } from "@/components/auth-form"

export const metadata = { title: "Sign in — SNIP / 26" }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard")
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  )
}
