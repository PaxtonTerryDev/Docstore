"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const types = ["deed", "mortgage", "release", "plat", "easement", "lien"]
const field = "w-full rounded-md border bg-background px-3 py-2 text-sm"

export function UploadDialog() {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const file = form.get("file") as File
    setBusy(true)
    try {
      setStatus("Registering…")
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
      const { id, uploadUrl } = await res.json()
      setStatus("Uploading…")
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      setStatus("Finalizing…")
      await fetch(`/api/documents/${id}/complete`, { method: "POST" })
      setStatus("Done — document is ready.")
      router.refresh()
    } catch {
      setStatus("Upload failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button onClick={() => ref.current?.showModal()}>
        <Upload /> Upload document
      </Button>
      <dialog
        ref={ref}
        className="m-auto w-full max-w-md rounded-xl border bg-background p-6 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Upload document</h2>
          <input name="file" type="file" required className={field} />
          <select name="docType" className={field} defaultValue="deed">
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input name="instrumentNumber" placeholder="Instrument number" required className={field} />
          <div className="flex gap-3">
            <input name="book" placeholder="Book" className={field} />
            <input name="page" type="number" placeholder="Page" className={field} />
          </div>
          <input name="recordedDate" type="date" className={field} />
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => ref.current?.close()}>
              Close
            </Button>
            <Button type="submit" disabled={busy}>
              Upload
            </Button>
          </div>
        </form>
      </dialog>
    </>
  )
}
