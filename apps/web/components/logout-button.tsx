"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      className="hover:bg-brand-foreground/10 hover:text-brand-foreground"
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
