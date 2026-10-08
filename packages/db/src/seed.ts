import { auditLog, db, documents, hashPassword, sessions, sql, users } from "./index"

await db.delete(auditLog)
await db.delete(documents)
await db.delete(sessions)
await db.delete(users)

const [admin, user] = await db
  .insert(users)
  .values([
    { email: "admin@docstore.local", name: "Alex Admin", role: "admin", passwordHash: hashPassword("admin123") },
    { email: "user@docstore.local", name: "Uma User", role: "user", passwordHash: hashPassword("user123") },
  ])
  .returning()

const types = ["deed", "mortgage", "release", "plat", "easement", "lien"]
const rows = Array.from({ length: 24 }, (_, i) => {
  const docType = types[i % types.length]!
  const instrument = String(2024000100 + i)
  return {
    filename: `${docType}-${instrument}.pdf`,
    contentType: "application/pdf",
    sizeBytes: 120_000 + i * 7_321,
    objectKey: `seed/${instrument}/${docType}-${instrument}.pdf`,
    docType,
    instrumentNumber: instrument,
    book: String(1200 + (i % 7)),
    page: 10 + i * 3,
    recordedDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    status: "ready" as const,
    uploadedBy: i % 3 === 0 ? admin!.id : user!.id,
  }
})
await db.insert(documents).values(rows)

await sql.end()
console.log("seeded", rows.length, "documents")
