import { useState, useMemo } from "react";

export default function DataTable({ columns = [], data = [], actions = [] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  if (!Array.isArray(columns)) columns = [];
  if (!Array.isArray(data)) data = [];

  const filteredData = useMemo(() => {
    if (!search) return data;

    return data.filter((row) => {
      if (Array.isArray(row)) {
        return row.some((cell) => String(cell).toLowerCase().includes(search.toLowerCase()));
      } else if (typeof row === "object" && row !== null) {
        return columns.some((col) => {
          const value = row[col];
          return String(value ?? "").toLowerCase().includes(search.toLowerCase());
        });
      }
      return false;
    });
  }, [data, search, columns]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
              {actions.length > 0 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx}>
                  {Array.isArray(row)
                    ? row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)
                    : columns.map((col, cIdx) => <td key={cIdx}>{row[col] ?? "-"}</td>)}
                  {actions.length > 0 && (
                    <td className="flex gap-2">
                      {actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          className={action.className || "btn btn-sm btn-primary"}
                          onClick={() => action.onClick(row)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="join justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <input
              key={p}
              type="radio"
              name="pagination"
              aria-label={p}
              className="join-item btn btn-square"
              checked={page === p}
              onChange={() => setPage(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
