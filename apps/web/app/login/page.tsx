"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const field = "w-full rounded-md border bg-background px-3 py-2 text-sm"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push("/")
      router.refresh()
    } else {
      setError((await res.json()).error)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border p-8">
        <div className="flex items-center gap-2">
          <FileText className="size-6" />
          <h1 className="font-heading text-2xl font-medium">DocStore</h1>
        </div>
        <input name="email" type="email" placeholder="Email" required className={field} />
        <input name="password" type="password" placeholder="Password" required className={field} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  )
}
