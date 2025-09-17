import { supabase } from "./supabaseClient";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

export async function getEmployees() {
  const { data, error } = await supabase.from("profiles").select("*");
  return { data, error };
}

export async function getDrivers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver");
  return { data, error };
}

export async function addEmployee(profile) {
  const { data, error } = await supabase.from("profiles").insert(profile).select().single();
  return { data, error };
}

export async function getVehicles() {
  const { data, error } = await supabase.from("vehicles").select("*");
  return { data, error };
}

export async function addVehicle(vehicle) {
  const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
  return { data, error };
}

export async function updateVehicle(id, updates) {
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export const getTrips = async (filters = {}, role = "admin") => {
  try {
    let query = supabase
      .from("trips")
      .select(`
        *,
        driver:profiles!trips_driver_id_fkey(id, name, email),
        requester:profiles!trips_requester_id_fkey(id, name, email),
        approver:profiles!trips_approver_id_fkey(id, name, email),
        vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, make, model, year, odometer, status),
        route_points:trip_route_points!trip_route_points_trip_id_fkey(*),
        route_events:route_events!route_events_trip_id_fkey(*, moved_by:profiles!route_events_moved_by_fkey(id, name))
      `)
      .order("created_at", { ascending: false });

    if (role !== "admin" && filters.id) {
      query = query.eq("id", filters.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching trips:", error);
    return { data: null, error };
  }
};

export async function completeTrip(tripId) {
  const { data, error } = await supabase
    .from("trips")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();

  if (error) {
    console.error("Error completing trip:", error);
    throw error;
  }

  return { data, error };
}

export async function getMyTrips(userId) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .or(`requester_id.eq.${userId},driver_id.eq.${userId}`);

  if (error) {
    console.error("getMyTrips error:", error);
    throw error;
  }

  const tripsWithDetails = await Promise.all(
    data.map(async (trip) => {
      const { data: driver } = await supabase
        .from("profiles")
        .select("id,name")
        .eq("id", trip.driver_id)
        .single();

      const { data: requester } = await supabase
        .from("profiles")
        .select("id,name")
        .eq("id", trip.requester_id)
        .single();

      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", trip.vehicle_id)
        .single();

      const { data: destinations } = await supabase
        .from("trip_route_points")
        .select("*")
        .eq("trip_id", trip.id)
        .order("seq", { ascending: true });

      return { ...trip, driver, requester, vehicle, destinations: destinations || [] };
    })
  );

  return tripsWithDetails;
}

export const getTripById = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        driver:profiles!trips_driver_id_fkey(id, name, email),
        requester:profiles!trips_requester_id_fkey(id, name, email),
        approver:profiles!trips_approver_id_fkey(id, name, email),
        vehicle:vehicles!trips_vehicle_id_fkey(id, plate_number, make, model, year, odometer, status),
        route_points:trip_route_points!trip_route_points_trip_id_fkey(*),
        route_events:route_events!route_events_trip_id_fkey(*, moved_by:profiles!route_events_moved_by_fkey(id, name)),
        expenses:expenses!expenses_trip_id_fkey(*, reported_by:profiles!expenses_reported_by_fkey(id, name))
      `)
      .eq("id", tripId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching trip by ID:", error);
    return { data: null, error };
  }
};

export async function requestTrip(trip) {
  const tripWithDefaults = {
    status: "draft",
    route: [],
    distance_travelled: 0,
    start_time: new Date(),
    ...trip,
  };

  const { data, error } = await supabase
    .from("trips")
    .insert(tripWithDefaults)
    .select()
    .single();

  if (error) console.error("Supabase insert error:", error);
  return { data, error };
}

export const updateTripStatus = async (tripId, status, denyReason = null) => {
  try {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (denyReason) {
      updates.deny_reason = denyReason;
    }

    const { data, error } = await supabase
      .from("trips")
      .update(updates)
      .eq("id", tripId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating trip status:", error);
    return { data: null, error };
  }
};

export async function addTrip(trip) {
  const tripWithDefaults = {
    status: "requested",
    route: [],
    distance_travelled: 0,
    start_time: new Date(),
    ...trip,
  };

  const { data, error } = await supabase
    .from("trips")
    .insert(tripWithDefaults)
    .select()
    .single();

  if (error) console.error("Supabase insert error:", error);
  return { data, error };
}

export async function updateTrip(id, updates) {
  const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function cancelTrip(tripId) {
  const { data, error } = await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("id", tripId)
    .select()
    .single();
  return { data, error };
}

export async function addTripRoutePoint(point) {
  const { data, error } = await supabase
    .from("trip_route_points")
    .insert(point)
    .select()
    .single();
  return { data, error };
}

export async function getTripRoutePoints(tripId) {
  const { data, error } = await supabase
    .from("trip_route_points")
    .select("*")
    .eq("trip_id", tripId)
    .order("seq", { ascending: true });
  return { data, error };
}

export async function getExpenses(filter = {}) {
  let query = supabase.from("expenses").select("*, profiles!expenses_reported_by_fkey(name)");

  if (filter.tripId) query = query.eq("trip_id", filter.tripId);
  if (filter.reportedBy) query = query.eq("reported_by", filter.reportedBy);

  const { data, error } = await query;
  return { data, error };
}

export async function getExpensesSum(filter = {}) {
  let query = supabase
    .from("expenses")
    .select("amount", { count: "exact" }); 

  if (filter.tripId) query = query.eq("trip_id", filter.tripId);
  if (filter.reportedBy) query = query.eq("reported_by", filter.reportedBy);

  const { data, error } = await query;

  const total = data?.reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0) || 0;

  return { total, error };
}

export const getMyExpenses = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        trip:trips!expenses_trip_id_fkey(id, reason),
        reported_by:profiles!expenses_reported_by_fkey(id, name)
      `)
      .eq("reported_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    throw error;
  }
};

export const getEmployeeExpenses = async (userId) => {
  try {
    const { data: userTrips, error: tripsError } = await supabase
      .from("trips")
      .select("id")
      .eq("requester_id", userId);

    if (tripsError) throw tripsError;

    const tripIds = userTrips?.map(trip => trip.id) || [];

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        type,
        amount,
        reason,
        proof_url,
        created_at,
        updated_at,
        trip_id,
        reported_by,
        trip:trips!expenses_trip_id_fkey (
          id,
          requester_id,
          reason
        )
      `)
      .or(`reported_by.eq.${userId}${tripIds.length > 0 ? `,trip_id.in.(${tripIds.join(',')})` : ''}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user expenses:", error);
    throw error;
  }
};

export async function addExpense(expense) {
  const { data, error } = await supabase.from("expenses").insert(expense).select().single();
  return { data, error };
}

export async function updateExpense(id, updates) {
  const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
  return { data, error };
}

export const uploadProof = async (expenseId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expenseId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    const { data, error } = await supabase.storage
      .from('proof')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('proof')
      .getPublicUrl(filePath);

    return { data: { path: publicUrl }, error: null };
  } catch (error) {
    console.error("Error uploading proof:", error);
    return { data: null, error };
  }
};

export const updateExpenseProof = async (expenseId, proofUrl) => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .update({ 
        proof_url: proofUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", expenseId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating expense proof:", error);
    return { data: null, error };
  }
};

export const deleteProof = async (fileUrl) => {
  try {
    const urlParts = fileUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('proof') + 1).join('/');
    
    const { error } = await supabase.storage
      .from('proof')
      .remove([filePath]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting proof:", error);
    return { error };
  }
};

export async function getFiles(filter = {}) {
  let query = supabase.from("files").select("*");
  if (filter.tripId) query = query.eq("trip_id", filter.tripId);
  if (filter.expenseId) query = query.eq("expense_id", filter.expenseId);
  if (filter.userId) query = query.eq("user_id", filter.userId);

  const { data, error } = await query;
  return { data, error };
}
