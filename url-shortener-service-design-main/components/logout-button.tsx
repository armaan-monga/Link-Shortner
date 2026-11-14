"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/client"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" })
        router.push("/")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}
