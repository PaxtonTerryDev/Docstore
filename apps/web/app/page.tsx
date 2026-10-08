import Link from "next/link"
import { audit } from "@/lib/audit"
import { requireUser } from "@/lib/session"
import { and, db, desc, documents, eq, ilike } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { UploadDialog } from "@/components/upload-dialog"

const types = ["deed", "mortgage", "release", "plat", "easement", "lien"]
const field = "rounded-md border bg-background px-3 py-2 text-sm"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const user = await requireUser()
  const { q, type } = await searchParams
  if (q || type) {
    await audit(user.id, "search", undefined, [q && `instrument "${q}"`, type && `type ${type}`].filter(Boolean).join(", "))
  }
  const rows = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.status, "ready"),
        q ? ilike(documents.instrumentNumber, `%${q}%`) : undefined,
        type ? eq(documents.docType, type) : undefined
      )
    )
    .orderBy(desc(documents.createdAt))
    .limit(100)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">Documents</h1>
        <UploadDialog />
      </div>

      <form className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Instrument number" className={`${field} w-64`} />
        <select name="type" defaultValue={type ?? ""} className={field}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Instrument</th>
              <th className="p-3">Type</th>
              <th className="p-3">Book / Page</th>
              <th className="p-3">Recorded</th>
              <th className="p-3">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t transition-colors hover:bg-muted/40">
                <td className="p-3 font-mono">
                  <Link href={`/documents/${d.id}`} className="underline-offset-4 hover:underline">
                    {d.instrumentNumber}
                  </Link>
                </td>
                <td className="p-3 capitalize">{d.docType}</td>
                <td className="p-3">
                  {d.book ?? "—"} / {d.page ?? "—"}
                </td>
                <td className="p-3">{d.recordedDate ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{d.filename}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
