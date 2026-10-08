"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      className="hover:bg-white/10 hover:text-white"
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
