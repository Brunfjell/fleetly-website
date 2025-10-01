import { useState } from "react";
import { supabase } from "../../../api/supabaseClient";

export default function CompleteTrip({ tripId, userId, expenses, onBack, onDepart, isDeparting }) {
  const [errorMessage, setErrorMessage] = useState("");

  const handleComplete = async () => {
    setErrorMessage("");

    const invalidExpense = expenses.find((exp) => exp.amount <= 0);
    if (invalidExpense) {
      setErrorMessage(`Cannot complete trip. Expense "${invalidExpense.type}" has an amount of 0.`);
      return;
    }

    if (!confirm("Are you sure you want to complete this trip?")) return;

    try {
      if (expenses.length > 0) {
        const expensesToInsert = expenses.map((exp) => ({
          trip_id: tripId,
          type: exp.type,
          amount: exp.amount,
          reason: exp.reason,
          reported_by: userId,
        }));

        const { error: expenseError } = await supabase
          .from("expenses")
          .insert(expensesToInsert);

        if (expenseError) throw expenseError;
      }

      const { error: tripError } = await supabase
        .from("trips")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", tripId);

      if (tripError) throw tripError;

      onBack();
    } catch (err) {
      console.error("Failed to complete trip:", err);
      setErrorMessage("Failed to complete trip. Please try again.");
    }
  };

  return (
    <div>
      {errorMessage && (
        <div role="alert" className="alert alert-error mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        className={`btn w-full mb-2 ${isDeparting ? "btn-warning" : "btn-primary"}`}
        onClick={onDepart}
      >
        {isDeparting ? "Stop Depart" : "Depart"}
      </button>

      <button className="btn btn-success w-full" onClick={handleComplete}>
        Complete Trip
      </button>
    </div>
  );
}
