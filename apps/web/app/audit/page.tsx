import Link from "next/link"
import { notFound } from "next/navigation"
import { and, auditLog, db, desc, documents, eq, users } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { getUser } from "@/lib/session"

const actions = ["upload", "view", "download", "search"] as const
const field = "rounded-md border bg-background px-3 py-2 text-sm"
const badge: Record<string, string> = {
  upload: "bg-emerald-500/15 text-emerald-500",
  view: "bg-sky-500/15 text-sky-500",
  download: "bg-amber-500/15 text-amber-500",
  search: "bg-violet-500/15 text-violet-500",
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-medium">Audit log</h1>

      <form className="flex gap-3">
        <select name="action" defaultValue={action ?? ""} className={field}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select name="user" defaultValue={user ?? ""} className={field}>
          <option value="">All users</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
      </form>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t transition-colors hover:bg-muted/40">
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {r.at.toLocaleString()}
                </td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[r.action]}`}>
                    {r.action}
                  </span>
                </td>
                <td className="p-3">
                  {r.documentId ? (
                    <Link href={`/documents/${r.documentId}`} className="hover:underline">
                      <span className="font-mono">{r.instrument}</span>{" "}
                      <span className="text-muted-foreground">{r.filename}</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{r.detail}</span>
                  )}
                </td>
                <td className="p-3 font-mono text-muted-foreground">{r.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No activity yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
