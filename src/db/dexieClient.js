import Dexie from "dexie";

export const db = new Dexie("fleetlyDB");

db.version(1).stores({
  trips: "id, requester_id, driver_id, status, created_at",
  expenses: "id, trip_id, reported_by, amount, status, created_at",
  sync_queue: "++id, operation, status"
});
