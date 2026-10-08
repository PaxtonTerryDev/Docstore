"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

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
      <Card className="w-full max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-5 px-8 py-4">
        <h1 className="font-heading text-3xl font-semibold">DocStore</h1>
        <p className="text-muted-foreground">Sign in to find and manage recorded documents.</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <p role="alert" className="min-h-6 text-base font-medium text-destructive">{error}</p>
        <Button type="submit">Sign in</Button>
      </form>
      </Card>
    </div>
  )
}
