"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const field = "h-12 w-full rounded-lg border-2 bg-background px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"

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
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-5 rounded-2xl border bg-card p-8 shadow-lg animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-7" aria-hidden />
          </span>
          <h1 className="font-heading text-3xl font-semibold">DocStore</h1>
        </div>
        <p className="text-lg text-muted-foreground">Sign in to find and manage recorded documents.</p>
        <label className="flex flex-col gap-2 text-base font-medium">
          Email address
          <input name="email" type="email" autoComplete="username" required className={field} />
        </label>
        <label className="flex flex-col gap-2 text-base font-medium">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={field} />
        </label>
        <p role="alert" className="min-h-6 text-base font-medium text-destructive">{error}</p>
        <Button type="submit" size="lg">Sign in</Button>
      </form>
    </div>
  )
}
