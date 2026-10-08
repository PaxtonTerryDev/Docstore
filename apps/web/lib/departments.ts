export type Field = {
  key: string
  label: string
  type: "text" | "number" | "date" | "select"
  options?: string[]
  required?: boolean
  table?: boolean
}

export type Department = {
  id: string
  label: string
  office: string
  idField: string
  docTypes: { value: string; label: string }[]
  fields: Field[]
}

const recorder: Department = {
  id: "recorder",
  label: "Recorder",
  office: "Utah County Recorder's Office",
  idField: "instrumentNumber",
  docTypes: [
    { value: "deed", label: "Deed" },
    { value: "mortgage", label: "Mortgage" },
    { value: "release", label: "Release" },
    { value: "plat", label: "Plat map" },
    { value: "easement", label: "Easement" },
    { value: "lien", label: "Lien" },
  ],
  fields: [
    { key: "instrumentNumber", label: "Instrument number", type: "text", required: true, table: true },
    { key: "book", label: "Book", type: "text" },
    { key: "page", label: "Page", type: "number" },
    { key: "recordedDate", label: "Date recorded", type: "date", table: true },
  ],
}

const cjc: Department = {
  id: "cjc",
  label: "Criminal Justice Coordinating Council",
  office: "Utah County Criminal Justice Coordinating Council",
  idField: "caseNumber",
  docTypes: [
    { value: "referral", label: "Referral" },
    { value: "assessment", label: "Assessment" },
    { value: "court-order", label: "Court order" },
    { value: "report", label: "Progress report" },
  ],
  fields: [
    { key: "caseNumber", label: "Case number", type: "text", required: true, table: true },
    { key: "program", label: "Program", type: "select", options: ["Drug court", "Mental health court", "Pretrial services"], table: true },
    { key: "caseManager", label: "Case manager", type: "text" },
    { key: "hearingDate", label: "Hearing date", type: "date", table: true },
  ],
}

const all: Record<string, Department> = { recorder, cjc }

export const departmentIds = Object.keys(all)

export const getDepartment = (id: string) => all[id] ?? recorder

export const typeLabel = (dept: Department, value: string) => dept.docTypes.find((t) => t.value === value)?.label ?? value

export const fieldValue = (f: Field, v: unknown) => {
  if (v === undefined || v === null || v === "") return "—"
  if (f.type === "date") return new Date(String(v)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
  return String(v)
}
