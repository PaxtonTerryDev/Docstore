import { putObject } from "@workspace/storage"
import { auditLog, db, documents, hashPassword, sessions, sql, users } from "./index"

function pdf(lines: string[]) {
  const esc = (s: string) => s.replace(/[\\()]/g, "\\$&")
  const text = lines
    .map((l, i) => `${i === 0 ? "/F2 20 Tf" : "/F1 12 Tf"} 1 0 0 1 72 ${720 - i * 26} Tm (${esc(l)}) Tj`)
    .join("\n")
  const stream = `BT\n${text}\nET`
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ]
  let out = "%PDF-1.4\n"
  const offsets = objs.map((o, i) => {
    const at = out.length
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
    return at
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(out)
}

await db.delete(auditLog)
await db.delete(documents)
await db.delete(sessions)
await db.delete(users)

const [admin, user, cjcUser] = await db
  .insert(users)
  .values([
    { email: "admin@docstore.local", name: "Alex Admin", role: "admin", passwordHash: hashPassword("admin123") },
    { email: "user@docstore.local", name: "Uma User", role: "user", passwordHash: hashPassword("user123") },
    { email: "cjc@docstore.local", name: "Casey CJC", department: "cjc", passwordHash: hashPassword("cjc123") },
  ])
  .returning()

const types: Record<string, string> = {
  deed: "WARRANTY DEED",
  mortgage: "DEED OF TRUST",
  release: "RELEASE OF LIEN",
  plat: "SUBDIVISION PLAT",
  easement: "UTILITY EASEMENT",
  lien: "NOTICE OF LIEN",
}
const parties = [
  ["Harold & Edith Brinkley", "Marisol Vega"],
  ["Provo Canyon Holdings LLC", "Thomas J. Whitaker"],
  ["Nephi Ranch Trust", "Utah Valley Land Partners"],
  ["Daniel R. Okafor", "Lindsey & Caleb Marsh"],
  ["Spanish Fork Development Co.", "Priya Natarajan"],
  ["Estate of Walter Hansen", "Clara & Ben Lindgren"],
]
const streets = ["Center St", "900 E", "Canyon Rd", "Lakeview Dr", "State St", "Orchard Ln"]
const cities = ["Provo", "Orem", "Lehi", "Spanish Fork", "American Fork", "Springville"]
const day = 86_400_000

const rows = await Promise.all(
  Array.from({ length: 30 }, async (_, i) => {
    const docType = Object.keys(types)[i % 6]!
    const instrument = String(2026000100 + i * 7)
    const book = String(1200 + (i % 7))
    const page = 10 + i * 3
    const date = new Date(Date.now() - (i * 2 + 1) * day)
    const recorded = date.toISOString().slice(0, 10)
    const [from, to] = parties[i % parties.length]!
    const body = pdf([
      types[docType]!,
      "Utah County Recorder's Office",
      "",
      `Instrument No.  ${instrument}`,
      `Recorded  ${recorded}   Book ${book}   Page ${page}`,
      "",
      `Grantor:  ${from}`,
      `Grantee:  ${to}`,
      `Property:  ${100 + i * 13} ${streets[i % 6]}, ${cities[i % 6]}, UT`,
      `Parcel:  ${String(20 + i).padStart(2, "0")}:${String(100 + i * 11).padStart(3, "0")}:00${String(i % 9)}${i % 5}`,
      "",
      "Sample document generated for the DocStore demo.",
    ])
    const filename = `${docType}-${instrument}.pdf`
    const objectKey = `seed/${instrument}/${filename}`
    await putObject(objectKey, body, "application/pdf")
    return {
      filename,
      contentType: "application/pdf",
      sizeBytes: body.length,
      objectKey,
      docType,
      metadata: { instrumentNumber: instrument, book, page, recordedDate: recorded },
      status: "ready" as const,
      uploadedBy: i % 3 === 0 ? admin!.id : user!.id,
      createdAt: date,
    }
  })
)
const cjcTypes: Record<string, string> = {
  referral: "PROGRAM REFERRAL",
  assessment: "RISK ASSESSMENT",
  "court-order": "ORDER OF THE COURT",
  report: "PROGRESS REPORT",
}
const programs = ["Drug court", "Mental health court", "Pretrial services"]
const managers = ["R. Delgado", "S. Whitfield", "M. Tanaka"]

const cjcRows = await Promise.all(
  Array.from({ length: 12 }, async (_, i) => {
    const docType = Object.keys(cjcTypes)[i % 4]!
    const caseNumber = `CJC-26-${String(400 + i * 3).padStart(4, "0")}`
    const date = new Date(Date.now() - (i * 3 + 1) * day)
    const hearing = new Date(Date.now() + (i + 2) * 3 * day).toISOString().slice(0, 10)
    const body = pdf([
      cjcTypes[docType]!,
      "Utah County Criminal Justice Coordinating Council",
      "",
      `Case No.  ${caseNumber}`,
      `Program:  ${programs[i % 3]}`,
      `Case manager:  ${managers[i % 3]}`,
      `Next hearing:  ${hearing}`,
      "",
      "Sample document generated for the DocStore demo.",
    ])
    const filename = `${docType}-${caseNumber}.pdf`
    const objectKey = `seed/${caseNumber}/${filename}`
    await putObject(objectKey, body, "application/pdf")
    return {
      filename,
      contentType: "application/pdf",
      sizeBytes: body.length,
      objectKey,
      docType,
      department: "cjc",
      metadata: { caseNumber, program: programs[i % 3], caseManager: managers[i % 3], hearingDate: hearing },
      status: "ready" as const,
      uploadedBy: cjcUser!.id,
      createdAt: date,
    }
  })
)
const inserted = await db.insert(documents).values([...rows, ...cjcRows]).returning()

const events: (typeof auditLog.$inferInsert)[] = inserted.slice(0, 12).flatMap((d, i) => [
  { userId: user!.id, action: "view" as const, documentId: d.id, ip: "10.0.4.21", at: new Date(Date.now() - i * 3_600_000 * 2) },
  ...(i % 3 === 0
    ? [{ userId: user!.id, action: "download" as const, documentId: d.id, ip: "10.0.4.21", at: new Date(Date.now() - i * 3_600_000 * 2 + 60_000) }]
    : []),
])
events.push(
  ...inserted.slice(12, 17).map((d, i) => ({
    userId: admin!.id,
    action: "upload" as const,
    documentId: d.id,
    ip: "10.0.4.8",
    at: new Date(Date.now() - (30 + i) * 3_600_000),
  }))
)
await db.insert(auditLog).values(events)

await sql.end()
console.log("seeded", rows.length + cjcRows.length, "documents,", events.length, "audit events")
