// app/components/new-main.tsx
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function NewMain<
  TData extends {
    name: string;
  },
>({ data }: { data: TData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const createColumns = (data: TData[]): ColumnDef<TData>[] => {
    if (!data.length) return [];
    const baseColumns = Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const value = info.getValue();
        if (value === null) return "null";
        if (value === undefined) return "undefined";
        if (value instanceof Date) {
          return value.toLocaleString();
        }
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return value;
      },
    }));
    const actionColumn: ColumnDef<TData> = {
      id: "action",
      header: "Action",
      cell: (info) => {
        const name = info.row.original.name;
        return (
          <form method="post" action={`/${name}`}>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Run
            </button>
          </form>
        );
      },
    };
    return [...baseColumns, actionColumn];
  };
  const table = useReactTable({
    data,
    columns: createColumns(data),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });
  return (
    <div className="p-4">
      <table className="min-w-full border-collapse border border-slate-200">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left bg-slate-100 border border-slate-200 cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && <ChevronUp className="w-4 h-4" />}
                    {header.column.getIsSorted() === "desc" && <ChevronDown className="w-4 h-4" />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border border-slate-200">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
