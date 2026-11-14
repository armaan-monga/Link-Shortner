import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AuthShell } from "@/components/auth-shell"
import { AuthForm } from "@/components/auth-form"

export const metadata = { title: "Create account — SNIP / 26" }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard")
  return (
    <AuthShell>
      <AuthForm mode="register" />
    </AuthShell>
  )
}
