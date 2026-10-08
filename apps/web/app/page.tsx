import Link from "next/link"
import { Clock, Files, HardDrive, Search, UserRound, FileSearch } from "lucide-react"
import { audit } from "@/lib/audit"
import { requireUser } from "@/lib/session"
import { docTypes, formatDate, formatSize, typeInfo } from "@/lib/doc-types"
import { and, db, desc, documents, eq, ilike, sqlTag } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { UploadDialog } from "@/components/upload-dialog"

const field = "h-12 rounded-lg border-2 bg-background px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"

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

  const ready = eq(documents.status, "ready")
  const [rows, [totals], byType] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(and(ready, q ? ilike(documents.instrumentNumber, `%${q}%`) : undefined, type ? eq(documents.docType, type) : undefined))
      .orderBy(desc(documents.createdAt))
      .limit(100),
    db
      .select({
        total: sqlTag<number>`count(*)::int`,
        week: sqlTag<number>`count(*) filter (where ${documents.createdAt} > now() - interval '7 days')::int`,
        bytes: sqlTag<number>`coalesce(sum(${documents.sizeBytes}), 0)::bigint`,
        mine: sqlTag<number>`count(*) filter (where ${documents.uploadedBy} = ${user.id})::int`,
      })
      .from(documents)
      .where(ready),
    db
      .select({ docType: documents.docType, n: sqlTag<number>`count(*)::int` })
      .from(documents)
      .where(ready)
      .groupBy(documents.docType),
  ])
  const counts = new Map(byType.map((r) => [r.docType, r.n]))

  const stats = [
    { label: "Documents stored", value: totals!.total, icon: Files, tint: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200" },
    { label: "Added this week", value: totals!.week, icon: Clock, tint: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
    { label: "Storage used", value: formatSize(Number(totals!.bytes)), icon: HardDrive, tint: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200" },
    { label: "Added by you", value: totals!.mine, icon: UserRound, tint: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  ]

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-lg text-muted-foreground">Find a recorded document, or add a new one.</p>
        </div>
        <UploadDialog />
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{ animationDelay: `${i * 80}ms` }}
            className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
          >
            <span className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
              <s.icon className="size-7" aria-hidden />
            </span>
            <div>
              <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-base text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section aria-label="Search" className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in duration-700">
        <form className="flex flex-wrap items-end gap-4">
          <label className="flex min-w-64 flex-1 flex-col gap-2 text-base font-medium">
            Instrument number
            <input name="q" defaultValue={q} placeholder="For example 2026000107" className={field} />
          </label>
          <label className="flex flex-col gap-2 text-base font-medium">
            Document type
            <select name="type" defaultValue={type ?? ""} className={field}>
              <option value="">All types</option>
              {docTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="lg">
            <Search /> Search
          </Button>
          {(q || type) && (
            <Link href="/" className="inline-flex h-12 items-center px-2 text-base font-medium text-primary underline underline-offset-4">
              Clear search
            </Link>
          )}
        </form>
        <div className="flex flex-wrap gap-2" aria-label="Browse by type">
          {docTypes.map((t) => (
            <Link
              key={t.value}
              href={`/?type=${t.value}`}
              className={`rounded-full px-4 py-2 text-base font-medium transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 ${t.badge} ${type === t.value ? "ring-2 ring-foreground" : ""}`}
            >
              {t.label} · {counts.get(t.value) ?? 0}
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Documents" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold" aria-live="polite">
            {q || type ? `${rows.length} ${rows.length === 1 ? "result" : "results"}` : "Recently added"}
          </h2>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <FileSearch className="size-14 text-muted-foreground" aria-hidden />
            <p className="text-xl font-medium">No documents found</p>
            <p className="text-base text-muted-foreground">Check the instrument number, or try a different document type.</p>
            <Link href="/" className="text-base font-medium text-primary underline underline-offset-4">
              Show all documents
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Instrument</th>
                  <th scope="col" className="px-6 py-3 font-medium">Type</th>
                  <th scope="col" className="px-6 py-3 font-medium">Book / Page</th>
                  <th scope="col" className="px-6 py-3 font-medium">Recorded</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const t = typeInfo(d.docType)
                  return (
                    <tr key={d.id} className="border-t transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4 font-mono text-lg font-medium">{d.instrumentNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${t.badge}`}>{t.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        {d.book ?? "—"} / {d.page ?? "—"}
                      </td>
                      <td className="px-6 py-4">{formatDate(d.recordedDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/documents/${d.id}`}
                          aria-label={`Open document ${d.instrumentNumber}`}
                          className="inline-flex h-11 items-center rounded-lg border-2 border-primary px-4 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
