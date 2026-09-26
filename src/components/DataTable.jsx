import { Inbox } from "lucide-react";

export default function DataTable({ columns, rows, onRowClick, emptyLabel = "No records match your filters." }) {
  if (!rows.length) {
    return (
      <div className="border border-border bg-surface flex flex-col items-center justify-center py-16 text-muted gap-2">
        <Inbox size={28} className="text-dim" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            {columns.map((col) => (
              <th key={col.key} className={`font-normal px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-border/60 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-surface2" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.align === "right" ? "text-right tabular" : ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
