import Link from "next/link"
import { notFound } from "next/navigation"
import { Download } from "lucide-react"
import { audit } from "@/lib/audit"
import { requireUser } from "@/lib/session"
import { db, documents, eq } from "@workspace/db"
import { presignGet } from "@workspace/storage"

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const [doc] = await db.select().from(documents).where(eq(documents.id, id))
  if (!doc) notFound()

  await audit(user.id, "view", id)
  const url = await presignGet(doc.objectKey)
  const isPdf = doc.contentType === "application/pdf"
  const isImage = doc.contentType.startsWith("image/")

  const meta: [string, string][] = [
    ["Instrument", doc.instrumentNumber ?? "—"],
    ["Type", doc.docType],
    ["Book / Page", `${doc.book ?? "—"} / ${doc.page ?? "—"}`],
    ["Recorded", doc.recordedDate ?? "—"],
    ["Size", `${(doc.sizeBytes / 1024).toFixed(1)} KB`],
  ]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← All documents
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{doc.filename}</h1>
        <a
          href={`/api/documents/${doc.id}/download`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          <Download className="size-4" /> Download
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm sm:grid-cols-5">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium capitalize">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-hidden rounded-xl border">
        {isPdf && <iframe src={url} className="h-[75vh] w-full" />}
        {isImage && <img src={url} alt={doc.filename} className="mx-auto max-h-[75vh]" />}
        {!isPdf && !isImage && (
          <p className="p-8 text-center text-muted-foreground">No preview available</p>
        )}
      </div>
    </div>
  )
}
