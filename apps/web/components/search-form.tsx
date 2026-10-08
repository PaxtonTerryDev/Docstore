"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { pageHref } from "@/lib/pagination"

type Item = { value: string; label: string }

export function SearchForm({ q = "", type = "", types, label }: { q?: string; type?: string; types: Item[]; label: string }) {
  const router = useRouter()
  const [text, setText] = useState(q)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => setText(q), [q])
  useEffect(() => () => clearTimeout(timer.current), [])

  function go(next: { q?: string; type?: string }) {
    router.replace(pageHref("/", { q, type, ...next }, 1), { scroll: false })
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-64 flex-1 flex-col gap-2">
        <Label htmlFor="q">{label}</Label>
        <Input
          id="q"
          name="q"
          value={text}
                    onChange={(e) => {
            const value = e.target.value
            setText(value)
            clearTimeout(timer.current)
            timer.current = setTimeout(() => go({ q: value.trim() }), 300)
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Document type</Label>
        <Select name="type" value={type} items={types} onValueChange={(v) => go({ type: v ?? "" })}>
          <SelectTrigger id="type" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(q || type) && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            clearTimeout(timer.current)
            setText("")
            go({ q: "", type: "" })
          }}
        >
          Clear search
        </Button>
      )}
    </form>
  )
}
