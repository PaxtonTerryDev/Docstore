"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm() {
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
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Find and manage recorded documents.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error && <FieldError role="alert">{error}</FieldError>}
        <Field>
          <Button type="submit">Sign in</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
