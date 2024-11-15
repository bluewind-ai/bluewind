// app/components/new-main.tsx

import type { SortingState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";


interface NewMainProps {
  data: any[];
}

const columnHelper = createColumnHelper<any>();

const createColumns = (data: any[]) => {
  if (!data.length) return [];

  console.log("Creating columns from sample data keys:", Object.keys(data[0]));

  return Object.keys(data[0]).map((key) =>
    columnHelper.accessor(key, {
      header: key,
      cell: (info) => info.getValue(),
    }),
  );
};

export function NewMain({ data }: NewMainProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  console.log("NewMain render with data:", {
    dataLength: data.length,
    firstRow: data[0],
  });

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
