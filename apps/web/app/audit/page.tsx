import Link from "next/link"
import { notFound } from "next/navigation"
import { and, auditLog, db, desc, documents, eq, sqlTag, users } from "@workspace/db"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { TablePagination } from "@/components/table-pagination"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { getUser } from "@/lib/session"

const actions = ["upload", "view", "download", "search"] as const

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string; page?: string }>
}) {
  const me = await getUser()
  if (me?.role !== "admin") notFound()

  const { action, user, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users)
  const actionItems = [{ value: "", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a[0]!.toUpperCase() + a.slice(1) }))]
  const userItems = [{ value: "", label: "All users" }, ...allUsers.map((u) => ({ value: u.id, label: u.email }))]
  const filter = and(
    action ? eq(auditLog.action, action as (typeof actions)[number]) : undefined,
    user ? eq(auditLog.userId, user) : undefined
  )
  const [{ n: total } = { n: 0 }] = await db.select({ n: sqlTag<number>`count(*)::int` }).from(auditLog).where(filter)
  const rows = await db
    .select({
      at: auditLog.at,
      action: auditLog.action,
      detail: auditLog.detail,
      email: users.email,
      documentId: auditLog.documentId,
      instrument: sqlTag<string | null>`coalesce(${documents.metadata}->>'instrumentNumber', ${documents.metadata}->>'caseNumber')`,
      filename: documents.filename,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .leftJoin(documents, eq(auditLog.documentId, documents.id))
    .where(filter)
    .orderBy(desc(auditLog.at))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Activity log</h1>
        <p className="mt-1 text-lg text-muted-foreground">Every upload, view, download and search, newest first.</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <Select name="action" defaultValue={action ?? ""} items={actionItems}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actionItems.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="user" defaultValue={user ?? ""} items={userItems}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {userItems.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Filter</Button>
      </form>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{r.at.toLocaleString()}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{r.action}</Badge>
                </TableCell>
                <TableCell>
                  {r.documentId ? (
                    <Link href={`/documents/${r.documentId}`} className="hover:underline">
                      <span className="font-mono">{r.instrument}</span>{" "}
                      <span className="text-muted-foreground">{r.filename}</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{r.detail}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                  No activity yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination path="/audit" params={{ action, user }} page={page} total={total} />
      </Card>
    </main>
  )
}
