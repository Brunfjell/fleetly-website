import { useState, useEffect, useRef } from "react";

export default function Expenses({ expenses, setExpenses }) {
  const EXPENSE_TYPES = ["fuel", "parking", "toll", "maintenance", "violation", "other"];
  const reasonTimeouts = useRef({});

  const addExpense = () => {
    const newExpense = {
      id: Date.now().toString(), 
      type: "fuel",
      amount: 0,
      reason: "",
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const updateExpense = (id, field, value) => {
    setExpenses(prev => prev.map(exp => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeExpense = id => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleReasonChange = (id, value) => {
    updateExpense(id, "reason", value);

    if (reasonTimeouts.current[id]) clearTimeout(reasonTimeouts.current[id]);
    reasonTimeouts.current[id] = setTimeout(() => {
      updateExpense(id, "reason", value);
    }, 500);
  };

  return (
    <div className="card p-2 bg-base-100">
      <h2 className="font-bold mb-2">Expenses</h2>
      <ul>
        {expenses.map(exp => (
          <li key={exp.id} className="flex items-center justify-between mb-1">
            <select
              value={exp.type}
              onChange={e => updateExpense(exp.id, "type", e.target.value)}
              className="select select-xs mr-1 w-28"
            >
              {EXPENSE_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Reason"
              value={exp.reason}
              onChange={e => handleReasonChange(exp.id, e.target.value)}
              className="input input-xs mr-1 flex-1"
            />

            <input
              type="number"
              placeholder="Amount"
              value={exp.amount}
              onChange={e =>
                updateExpense(exp.id, "amount", parseFloat(e.target.value) || 0)
              }
              className="input input-xs mr-1 w-16"
            />

            <button
              className="btn btn-xs btn-error"
              onClick={() => removeExpense(exp.id)}
            >
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
