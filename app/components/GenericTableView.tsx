// app/components/GenericTableView.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type GenericRecord = Record<string, any>;

interface GenericTableViewProps {
  data: GenericRecord[];
  extraColumns?: Array<{
    id: string;
    header: string;
    cell: (row: GenericRecord) => React.ReactNode;
  }>;
}

const columnHelper = createColumnHelper<GenericRecord>();

function createColumnsFromData(data: GenericRecord[], extraColumns: GenericTableViewProps['extraColumns'] = []) {
  if (data.length === 0) return [];

  // Get all unique keys from the data
  const keys = [...new Set(data.flatMap(Object.keys))];

  const dataColumns = keys.map((key) =>
    columnHelper.accessor(key, {
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      cell: (info) => {
        const value = info.getValue();
        if (value === null) return "null";
        if (typeof value === "object") return JSON.stringify(value);
        if (value instanceof Date) return value.toLocaleString();
        return String(value);
      },
    }),
  );

  // Add extra columns
  const extraColumnsConfig = extraColumns.map(col =>
    columnHelper.display({
      id: col.id,
      header: col.header,
      cell: (info) => col.cell(info.row.original)
    })
  );

  return [...dataColumns, ...extraColumnsConfig];
}

export function GenericTableView({ data, extraColumns }: GenericTableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = createColumnsFromData(data, extraColumns);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (data.length === 0) {
    return <div className="p-4">No data available</div>;
  }

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