import { db } from "./dexieClient";
import { supabase } from "../api/supabaseClient";

export async function pushSyncQueue() {
  const pending = await db.sync_queue.toArray();
  for (const item of pending) {
    try {
      const { table, data } = item.operation;
      await supabase.from(table).insert(data);
      await db.sync_queue.delete(item.id);
    } catch (err) {
      console.error("Sync failed:", err.message);
    }
  }
}

export async function pullFromServer() {
  const { data: trips } = await supabase.from("trips").select("*");
  if (trips) {
    await db.trips.clear();
    await db.trips.bulkAdd(trips);
  }

  const { data: expenses } = await supabase.from("expenses").select("*");
  if (expenses) {
    await db.expenses.clear();
    await db.expenses.bulkAdd(expenses);
  }
}
