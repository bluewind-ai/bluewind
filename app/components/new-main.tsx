// app/components/new-main.tsx

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
import { useNavigate, Form } from "@remix-run/react";
import { Button } from "./ui/button";

type ActionRecord = {
  id: number;
  name: string;
  displayName: string;
  lastCallStatus: string;
  lastRunAt: string | null;
  totalCalls: number;
};

interface NewMainProps {
  data: ActionRecord[];
}

const columnHelper = createColumnHelper<ActionRecord>();

const STATUS_COLORS = {
  completed: "text-green-600 bg-green-50",
  running: "text-blue-600 bg-blue-50",
  ready_for_approval: "text-yellow-600 bg-yellow-50",
  failed: "text-red-600 bg-red-50",
  never_run: "text-gray-500 bg-gray-50",
} as const;

function createColumns(navigate: (path: string) => void) {
  return [
    columnHelper.accessor("displayName", {
      header: "Action",
      cell: (info) => (
        <button
          onClick={() => navigate(`/actions/${info.row.original.name}`)}
          className="hover:underline font-medium text-left"
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor("lastCallStatus", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`px-2 py-1 rounded-full text-sm ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ""}`}
          >
            {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        );
      },
    }),
    columnHelper.accessor("lastRunAt", {
      header: "Last Run",
      cell: (info) => {
        const date = info.getValue();
        if (!date) return "Never";
        return new Date(date).toLocaleString();
      },
    }),
    columnHelper.accessor("totalCalls", {
      header: "Total Runs",
      cell: (info) => info.getValue().toLocaleString(),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <Form method="post" action={`/actions/${info.row.original.name}`}>
          <Button type="submit" variant="outline" size="sm">
            Run
          </Button>
        </Form>
      ),
    }),
  ];
}

export function NewMain({ data }: NewMainProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  const table = useReactTable({
    data,
    columns: createColumns(navigate),
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
