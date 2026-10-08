import Link from "next/link"
import { Clock, Files, HardDrive, Search, UserRound, FileSearch } from "lucide-react"
import { audit } from "@/lib/audit"
import { visibleTo } from "@/lib/access"
import { requireUser } from "@/lib/session"
import { formatSize } from "@/lib/doc-types"
import { fieldValue, getDepartment, typeLabel } from "@/lib/departments"
import { and, db, desc, documents, eq, ilike, sqlTag } from "@workspace/db"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { SearchForm } from "@/components/search-form"
import { TablePagination } from "@/components/table-pagination"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { UploadDialog } from "@/components/upload-dialog"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}) {
  const user = await requireUser()
  const { q, type, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const dept = getDepartment(user.department)
  const idField = dept.fields.find((f) => f.key === dept.idField)!
  const tableFields = dept.fields.filter((f) => f.table)
  const typeItems = [{ value: "", label: "All types" }, ...dept.docTypes]
  if (q || type) {
    await audit(user.id, "search", undefined, [q && `${idField.label.toLowerCase()} "${q}"`, type && `type ${type}`].filter(Boolean).join(", "))
  }

  const ready = and(eq(documents.status, "ready"), visibleTo(user))
  const filter = and(ready, q ? ilike(sqlTag`${documents.metadata}->>${dept.idField}`, `%${q}%`) : undefined, type ? eq(documents.docType, type) : undefined)
  const [rows, [matched], [totals], byType] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(filter)
      .orderBy(desc(documents.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sqlTag<number>`count(*)::int` }).from(documents).where(filter),
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
    { label: "Documents stored", value: totals!.total, icon: Files },
    { label: "Added this week", value: totals!.week, icon: Clock },
    { label: "Storage used", value: formatSize(Number(totals!.bytes)), icon: HardDrive },
    { label: "Added by you", value: totals!.mine, icon: UserRound },
  ]

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          {/*<p className="mt-1 text-lg text-muted-foreground">{user.role === "admin" ? "Find a recorded document, or add a new one." : "Find a recorded document."}</p>*/}
        </div>
        {user.role === "admin" && <UploadDialog dept={dept} />}
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
          >
            <CardContent className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center bg-secondary text-primary">
                <s.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
                <p className="text-base text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card aria-label="Search">
        <CardContent className="flex flex-col gap-4">
          <SearchForm q={q} type={type} types={typeItems} label={idField.label} />
          <div className="flex flex-wrap gap-2" aria-label="Browse by type">
            {dept.docTypes.map((t) => (
              <Badge
                key={t.value}
                variant={type === t.value ? "default" : "outline"}
                render={<Link href={`/?type=${t.value}`} />}
              >
                {t.label} · {counts.get(t.value) ?? 0}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card aria-label="Documents">
        <CardHeader className="border-b">
          <CardTitle className="text-xl" aria-live="polite">
            {q || type ? `${matched!.n} ${matched!.n === 1 ? "result" : "results"}` : "Recently added"}
          </CardTitle>
        </CardHeader>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <FileSearch className="size-14 text-muted-foreground" aria-hidden />
            <p className="text-xl font-medium">No documents found</p>
            <p className="text-base text-muted-foreground">Check the {idField.label.toLowerCase()}, or try a different document type.</p>
            <Link href="/" className="text-base font-medium text-primary underline underline-offset-4">
              Show all documents
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                {tableFields.map((f) => (
                  <TableHead key={f.key}>{f.label}</TableHead>
                ))}
                <TableHead><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel(dept, d.docType)}</Badge>
                      {d.restricted && <Badge variant="outline" className="ml-2">Restricted</Badge>}
                    </TableCell>
                    {tableFields.map((f) => (
                      <TableCell key={f.key} className={f.key === dept.idField ? "font-mono font-medium" : undefined}>
                        {fieldValue(f, d.metadata[f.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="outline" nativeButton={false} render={<Link href={`/documents/${d.id}`} aria-label={`Open document ${d.metadata[dept.idField]}`} />}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <TablePagination path="/" params={{ q, type }} page={page} total={matched!.n} />
      </Card>
    </main>
  )
}
