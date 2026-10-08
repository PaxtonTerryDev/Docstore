import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"
import { audit } from "@/lib/audit"
import { canView } from "@/lib/access"
import { RestrictButton } from "@/components/restrict-button"
import { requireUser } from "@/lib/session"
import { formatDate, formatSize, typeInfo } from "@/lib/doc-types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { db, documents, eq } from "@workspace/db"
import { presignGet } from "@workspace/storage"

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const [doc] = await db.select().from(documents).where(eq(documents.id, id))
  if (!doc || !canView(user, doc)) notFound()

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
    <main className="mx-auto flex h-full max-w-6xl flex-col gap-4 p-6 sm:p-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 py-2 pr-3 font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-5" aria-hidden /> Back to all documents
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold">
            {t.label} {doc.instrumentNumber}
          </h1>
          <Badge variant="secondary">{t.label}</Badge>
          {doc.restricted && <Badge variant="outline">Restricted</Badge>}
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <RestrictButton id={doc.id} restricted={doc.restricted} />
          )}
          <Button
            nativeButton={false}
            render={<a href={`/api/documents/${doc.id}/download`} />}
          >
            <Download /> Download
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="text-base font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card className="min-h-0 flex-1 py-0">
        {isPdf && (
          <iframe
            src={url}
            title={`Preview of ${doc.filename}`}
            className="h-full w-full"
          />
        )}
        {isImage && (
          <img src={url} alt={doc.filename} className="mx-auto h-full object-contain" />
        )}
        {!isPdf && !isImage && (
          <p className="p-12 text-center text-lg text-muted-foreground">
            A preview isn't available for this file. Use Download to open it.
          </p>
        )}
      </Card>
    </main>
  )
}
