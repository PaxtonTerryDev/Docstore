"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Upload } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { docTypes } from "@/lib/doc-types"


export function UploadDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState("")
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle")

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const file = form.get("file") as File
    setState("busy")
    try {
      setStatus("Getting ready…")
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      })
      if (!res.ok) throw new Error()
      const { id, uploadUrl } = await res.json()
      setStatus("Uploading your file…")
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      setStatus("Saving…")
      const done = await fetch(`/api/documents/${id}/complete`, { method: "POST" })
      if (!done.ok) throw new Error()
      setStatus("Your document was saved.")
      setState("done")
      formRef.current?.reset()
      router.refresh()
    } catch {
      setStatus("Something went wrong and the document was not saved. Please try again.")
      setState("error")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setState("idle")
          setStatus("")
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Upload /> Add a document
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a document</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">File (PDF or image)</Label>
            <Input id="file" name="file" type="file" required className="h-auto py-1.5" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="docType">Document type</Label>
            <Select name="docType" defaultValue="deed" items={docTypes}>
              <SelectTrigger id="docType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instrumentNumber">Instrument number</Label>
            <Input id="instrumentNumber" name="instrumentNumber" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="book">Book</Label>
              <Input id="book" name="book" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page">Page</Label>
              <Input id="page" name="page" type="number" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="recordedDate">Date recorded</Label>
            <Input id="recordedDate" name="recordedDate" type="date" />
          </div>
          <div role="status" aria-live="polite" className="min-h-7 text-base">
            {state === "busy" && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> {status}
              </p>
            )}
            {state === "done" && (
              <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-5" /> {status}
              </p>
            )}
            {state === "error" && <p className="font-medium text-destructive">{status}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {state === "done" ? "Finished" : "Cancel"}
            </Button>
            <Button type="submit" disabled={state === "busy"}>
              Save document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
