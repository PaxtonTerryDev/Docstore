import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"
import { audit } from "@/lib/audit"
import { requireUser } from "@/lib/session"
import { formatDate, formatSize, typeInfo } from "@/lib/doc-types"
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
  const t = typeInfo(doc.docType)

  const meta: [string, string][] = [
    ["Instrument number", doc.instrumentNumber ?? "—"],
    ["Book / Page", `${doc.book ?? "—"} / ${doc.page ?? "—"}`],
    ["Date recorded", formatDate(doc.recordedDate)],
    ["File size", formatSize(doc.sizeBytes)],
  ]

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-lg py-2 pr-3 text-lg font-medium text-primary hover:underline">
        <ArrowLeft className="size-5" aria-hidden /> Back to all documents
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold">{t.label} {doc.instrumentNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${t.badge}`}>{t.label}</span>
        </div>
        <a
          href={`/api/documents/${doc.id}/download`}
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <Download className="size-5" aria-hidden /> Download
        </a>
      </div>
      <dl className="grid grid-cols-2 gap-6 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt className="text-base text-muted-foreground">{k}</dt>
            <dd className="text-xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {isPdf && <iframe src={url} title={`Preview of ${doc.filename}`} className="h-[75vh] w-full" />}
        {isImage && <img src={url} alt={doc.filename} className="mx-auto max-h-[75vh]" />}
        {!isPdf && !isImage && (
          <p className="p-12 text-center text-lg text-muted-foreground">
            A preview isn't available for this file. Use Download to open it.
          </p>
        )}
      </div>
    </main>
  )
}
