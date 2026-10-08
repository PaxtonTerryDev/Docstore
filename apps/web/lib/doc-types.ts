export const docTypes = [
  { value: "deed", label: "Deed", badge: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" },
  { value: "mortgage", label: "Mortgage", badge: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200" },
  { value: "release", label: "Release", badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  { value: "plat", label: "Plat map", badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  { value: "easement", label: "Easement", badge: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200" },
  { value: "lien", label: "Lien", badge: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200" },
]

export const typeInfo = (value: string) =>
  docTypes.find((t) => t.value === value) ?? { value, label: value, badge: "bg-muted text-foreground" }

export const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const formatDate = (d: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "—"
