"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" })
        router.push("/login")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}
