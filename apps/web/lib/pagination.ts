export const PAGE_SIZE = 20

export const parsePage = (value?: string) => Math.max(1, Math.floor(Number(value)) || 1)

export const pageHref = (path: string, params: Record<string, string | undefined>, page: number) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
  if (page > 1) qs.set("page", String(page))
  const s = qs.toString()
  return s ? `${path}?${s}` : path
}
