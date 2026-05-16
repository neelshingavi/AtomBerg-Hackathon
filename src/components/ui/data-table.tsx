"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enablePagination?: boolean;
  pageSize?: number;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  onExport?: () => void;
  bulkActions?: React.ReactNode;
  stickyHeader?: boolean;
  globalFilterFn?: (row: T, filter: string) => boolean;
  filterToolbar?: React.ReactNode;
  onSelectedRowsChange?: (rows: T[]) => void;
  getRowId?: (row: T) => string;
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No results found.",
  emptyIcon,
  emptyAction,
  className,
  isLoading,
  enableSearch = true,
  searchPlaceholder = "Search…",
  enablePagination = true,
  pageSize = 10,
  enableRowSelection = false,
  enableColumnVisibility = true,
  onExport,
  bulkActions,
  stickyHeader = true,
  globalFilterFn,
  filterToolbar,
  onSelectedRowsChange,
  getRowId,
  renderMobileCard,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedFilter = useDebouncedValue(globalFilter, 250);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const selectionColumn = useMemo<ColumnDef<T, unknown> | null>(() => {
    if (!enableRowSelection) return null;
    return {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
  }, [enableRowSelection]);

  const allColumns = useMemo(() => {
    if (selectionColumn) return [selectionColumn, ...columns];
    return columns;
  }, [selectionColumn, columns]);

  const filteredData = useMemo(() => {
    if (!debouncedFilter || !globalFilterFn) return data;
    return data.filter((row) => globalFilterFn(row, debouncedFilter));
  }, [data, debouncedFilter, globalFilterFn]);

  const table = useReactTable({
    data: globalFilterFn ? filteredData : data,
    columns: allColumns,
    getRowId: getRowId ?? undefined,
    state: {
      sorting,
      columnFilters,
      globalFilter: globalFilterFn ? "" : globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: { pagination: { pageSize } },
    enableRowSelection,
  });

  const selectedCount = Object.keys(rowSelection).length;

  useEffect(() => {
    if (!onSelectedRowsChange) return;
    const selected = table.getSelectedRowModel().rows.map((r) => r.original);
    onSelectedRowsChange(selected);
  }, [rowSelection, onSelectedRowsChange, table]);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-9 w-full max-w-sm skeleton-shimmer" />
        <Skeleton className="h-64 w-full rounded-lg skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {filterToolbar}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {filterToolbar}
          {enableSearch && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-9 pl-8"
                aria-label="Search table"
              />
            </div>
          )}
          {selectedCount > 0 && bulkActions && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{selectedCount} selected</span>
              {bulkActions}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="h-9">
                    <Columns3 className="mr-1.5 h-4 w-4" />
                    Columns
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                {table
                  .getAllColumns()
                  .filter((c) => c.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onExport && (
            <Button variant="outline" size="sm" className="h-9" onClick={onExport}>
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {renderMobileCard && (
        <div className="space-y-3 md:hidden">
          {table.getRowModel().rows.map((row) => (
            <div key={row.id} className="rounded-lg border bg-card p-4 shadow-elevation-sm">
              {renderMobileCard(row.original)}
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card shadow-elevation-sm",
          stickyHeader && "table-sticky-header",
          renderMobileCard && "hidden md:block"
        )}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap text-xs font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={allColumns.length} className="h-48 p-0">
                    <EmptyState
                      icon={emptyIcon}
                      title={emptyMessage}
                      action={emptyAction}
                      className="border-0 bg-transparent shadow-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="interactive-row"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DataTableSortHeader({
  column,
  title,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-semibold"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
    </Button>
  );
}
