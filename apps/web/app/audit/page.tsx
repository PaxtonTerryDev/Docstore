import Link from "next/link"
import { notFound } from "next/navigation"
import { and, auditLog, db, desc, documents, eq, users } from "@workspace/db"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { getUser } from "@/lib/session"

const actions = ["upload", "view", "download", "search"] as const
const badge: Record<string, string> = {
  upload: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  view: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  download: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  search: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string }>
}) {
  const me = await getUser()
  if (me?.role !== "admin") notFound()

  const { action, user } = await searchParams
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users)
  const actionItems = [{ value: "", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a[0]!.toUpperCase() + a.slice(1) }))]
  const userItems = [{ value: "", label: "All users" }, ...allUsers.map((u) => ({ value: u.id, label: u.email }))]
  const rows = await db
    .select({
      at: auditLog.at,
      action: auditLog.action,
      ip: auditLog.ip,
      detail: auditLog.detail,
      email: users.email,
      documentId: auditLog.documentId,
      instrument: documents.instrumentNumber,
      filename: documents.filename,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .leftJoin(documents, eq(auditLog.documentId, documents.id))
    .where(
      and(
        action ? eq(auditLog.action, action as (typeof actions)[number]) : undefined,
        user ? eq(auditLog.userId, user) : undefined
      )
    )
    .orderBy(desc(auditLog.at))
    .limit(200)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 sm:p-8 animate-in fade-in duration-500">
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
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{r.at.toLocaleString()}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>
                  <Badge className={`capitalize ${badge[r.action]}`}>{r.action}</Badge>
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
                <TableCell className="font-mono text-muted-foreground">{r.ip}</TableCell>
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
      </Card>
    </main>
  )
}
