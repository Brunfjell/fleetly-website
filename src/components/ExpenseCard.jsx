import { formatCurrency, formatDate } from "../utils/formatters";

export default function ExpenseCard({ expense }) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition">
      <div className="card-body">
        <h2 className="card-title text-lg">
          {expense.category}
        </h2>
        <p className="text-sm text-gray-500">
          {formatDate(expense.date)}
        </p>
        <p className="mt-2">
          Amount:{" "}
          <span className="font-semibold">{formatCurrency(expense.amount)}</span>
        </p>
        <p className="text-sm">{expense.notes}</p>
        <div className="card-actions justify-end mt-3">
          <button className="btn btn-sm btn-outline">Details</button>
        </div>
      </div>
    </div>
  );
}
