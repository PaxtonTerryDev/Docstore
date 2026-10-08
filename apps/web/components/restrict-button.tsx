"use client"

import { useRouter } from "next/navigation"
import { Lock, LockOpen } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export function RestrictButton({ id, restricted }: { id: string; restricted: boolean }) {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await fetch(`/api/documents/${id}/restrict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restricted: !restricted }),
        })
        router.refresh()
      }}
    >
      {restricted ? <LockOpen /> : <Lock />} {restricted ? "Remove restriction" : "Restrict to admins"}
    </Button>
  )
}
