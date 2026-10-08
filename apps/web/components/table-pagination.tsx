import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@workspace/ui/components/pagination"
import { PAGE_SIZE, pageHref } from "@/lib/pagination"

export function TablePagination({
  path,
  params,
  page,
  total,
}: {
  path: string
  params: Record<string, string | undefined>
  page: number
  total: number
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (pages === 1) return null
  const off = "pointer-events-none opacity-50"

  return (
    <Pagination className="border-t px-4 py-3">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={pageHref(path, params, page - 1)}
            aria-disabled={page <= 1}
            className={page <= 1 ? off : undefined}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="px-3 text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href={pageHref(path, params, page + 1)}
            aria-disabled={page >= pages}
            className={page >= pages ? off : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
