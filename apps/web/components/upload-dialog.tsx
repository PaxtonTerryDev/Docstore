"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Upload, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { docTypes } from "@/lib/doc-types"

const field = "h-12 w-full rounded-lg border-2 bg-background px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
const label = "flex flex-col gap-2 text-base font-medium"

export function UploadDialog() {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
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
    <>
      <Button size="lg" onClick={() => ref.current?.showModal()}>
        <Upload /> Add a document
      </Button>
      <dialog
        ref={ref}
        onClose={() => {
          setState("idle")
          setStatus("")
        }}
        aria-labelledby="upload-title"
        className="m-auto w-full max-w-lg rounded-2xl border bg-background p-8 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 open:duration-200"
      >
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <h2 id="upload-title" className="font-heading text-2xl font-semibold">Add a document</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => ref.current?.close()}
              className="rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            >
              <X className="size-6" />
            </button>
          </div>
          <label className={label}>
            File (PDF or image)
            <input name="file" type="file" required className={`${field} h-auto py-3 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-base file:font-medium file:text-primary-foreground`} />
          </label>
          <label className={label}>
            Document type
            <select name="docType" className={field} defaultValue="deed">
              {docTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Instrument number
            <input name="instrumentNumber" required className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>
              Book
              <input name="book" className={field} />
            </label>
            <label className={label}>
              Page
              <input name="page" type="number" className={field} />
            </label>
          </div>
          <label className={label}>
            Date recorded
            <input name="recordedDate" type="date" className={field} />
          </label>
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
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="lg" onClick={() => ref.current?.close()}>
              {state === "done" ? "Finished" : "Cancel"}
            </Button>
            <Button type="submit" size="lg" disabled={state === "busy"}>
              Save document
            </Button>
          </div>
        </form>
      </dialog>
    </>
  )
}
