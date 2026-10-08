import { audit } from "@/lib/audit"
import { canView } from "@/lib/access"
import { getUser } from "@/lib/session"
import { db, documents, eq } from "@workspace/db"
import { headObject } from "@workspace/storage"

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await ctx.params
  const [doc] = await db.select().from(documents).where(eq(documents.id, id))
  if (!doc || !canView(user, doc)) return Response.json({ error: "not found" }, { status: 404 })

  const head = await headObject(doc.department, doc.objectKey).catch(() => null)
  if (!head) return Response.json({ error: "object missing" }, { status: 400 })

  await db
    .update(documents)
    .set({ status: "ready", sizeBytes: head.ContentLength ?? doc.sizeBytes })
    .where(eq(documents.id, id))
  await audit(user.id, "upload", id)
  return Response.json({ id, status: "ready" })
}
