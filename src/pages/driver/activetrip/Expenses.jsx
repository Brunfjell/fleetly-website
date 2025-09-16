export default function Expenses({ expenses, addExpense, updateExpense, removeExpense }) {
  return (
    <div className="card p-2 bg-base-100">
      <h2 className="font-bold mb-2">Expenses</h2>
      <ul>
        {expenses.map(exp => (
          <li key={exp.id} className="flex items-center justify-between mb-1">
            <input
              type="text"
              placeholder="Reason"
              value={exp.reason}
              onChange={e => updateExpense(exp.id, "reason", e.target.value)}
              className="input input-xs mr-1"
            />
            <input
              type="number"
              placeholder="Amount"
              value={exp.amount}
              onChange={e => updateExpense(exp.id, "amount", parseFloat(e.target.value))}
              className="input input-xs mr-1 w-16"
            />
            <button className="btn btn-xs btn-error" onClick={() => removeExpense(exp.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-xs mt-2" onClick={addExpense}>
        Add Expense
      </button>
    </div>
  );
}
