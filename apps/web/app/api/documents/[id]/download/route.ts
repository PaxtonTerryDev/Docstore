import { audit } from "@/lib/audit"
import { getUser } from "@/lib/session"
import { db, documents, eq } from "@workspace/db"
import { presignGet } from "@workspace/storage"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await ctx.params
  const [doc] = await db.select().from(documents).where(eq(documents.id, id))
  if (!doc) return Response.json({ error: "not found" }, { status: 404 })

  await audit(user.id, "download", id)
  const url = await presignGet(doc.objectKey, { filename: doc.filename, disposition: "attachment" })
  return Response.redirect(url, 302)
}
