import Link from "next/link"
import { notFound } from "next/navigation"
import { and, auditLog, db, desc, documents, eq, users } from "@workspace/db"
import { Button } from "@workspace/ui/components/button"
import { getUser } from "@/lib/session"

const actions = ["upload", "view", "download", "search"] as const
const field = "h-12 rounded-lg border-2 bg-background px-4 text-base focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
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
        <select name="action" defaultValue={action ?? ""} className={field}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a[0]!.toUpperCase() + a.slice(1)}</option>
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
        <Button type="submit" size="lg">Filter</Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Time</th>
              <th scope="col" className="px-5 py-3 font-medium">User</th>
              <th scope="col" className="px-5 py-3 font-medium">Action</th>
              <th scope="col" className="px-5 py-3 font-medium">Target</th>
              <th scope="col" className="px-5 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t transition-colors hover:bg-muted/40">
                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                  {r.at.toLocaleString()}
                </td>
                <td className="px-5 py-3">{r.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${badge[r.action]}`}>
                    {r.action}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {r.documentId ? (
                    <Link href={`/documents/${r.documentId}`} className="hover:underline">
                      <span className="font-mono">{r.instrument}</span>{" "}
                      <span className="text-muted-foreground">{r.filename}</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{r.detail}</span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-muted-foreground">{r.ip}</td>
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
    </main>
  )
}
