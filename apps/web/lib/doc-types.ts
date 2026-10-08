export const docTypes = [
  { value: "deed", label: "Deed" },
  { value: "mortgage", label: "Mortgage" },
  { value: "release", label: "Release" },
  { value: "plat", label: "Plat map" },
  { value: "easement", label: "Easement" },
  { value: "lien", label: "Lien" },
]

export const typeInfo = (value: string) =>
  docTypes.find((t) => t.value === value) ?? { value, label: value }

export const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const formatDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "—"
