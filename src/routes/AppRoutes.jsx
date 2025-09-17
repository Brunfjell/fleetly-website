import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleGuard from "../components/RoleGuard";
import { ROLES } from "../utils/roleUtils";

import AdminLayout from "../layouts/AdminLayout";
import DriverLayout from "../layouts/DriverLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

import Login from "../pages/auth/Login";

import Dashboard from "../pages/admin/Dashboard";
import Employees from "../pages/admin/Employees";
import Vehicles from "../pages/admin/Vehicles";
import Trips from "../pages/admin/Trips";
import Expenses from "../pages/admin/Expenses";

import TripInterface from "../pages/driver/TripInterface";
import DriverTrips from "../pages/driver/MyTrips";
import DriverExpenses from "../pages/driver/MyExpenses";

import TripRequest from "../pages/employee/TripRequest";
import EmployeeTrips from "../pages/employee/MyTrips";
import EmployeeExpenses from "../pages/employee/MyExpenses";

export default function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <span className="loading loading-infinity loading-xl"></span>
        <p className="text-gray-600">Loading application...</p>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/fleetly-website">
      <Routes>
        <Route
          path="/auth/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />

        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="trips" element={<Trips />} />
          <Route path="expenses" element={<Expenses />} />
        </Route>

        <Route
          path="/driver"
          element={
            <RoleGuard allowedRoles={[ROLES.DRIVER]}>
              <DriverLayout />
            </RoleGuard>
          }
        >
          <Route index element={<TripInterface />} />
          <Route path="trips" element={<DriverTrips />} />
          <Route path="expenses" element={<DriverExpenses />} />
        </Route>

        <Route
          path="/employee"
          element={
            <RoleGuard allowedRoles={[ROLES.EMPLOYEE]}>
              <EmployeeLayout />
            </RoleGuard>
          }
        >
          <Route index element={<TripRequest />} />
          <Route path="trips" element={<EmployeeTrips />} />
          <Route path="expenses" element={<EmployeeExpenses />} />
        </Route>

        <Route
          path="/"
          element={
            user ? (
              role === ROLES.ADMIN ? (
                <Navigate to="/admin" replace />
              ) : role === ROLES.DRIVER ? (
                <Navigate to="/driver" replace />
              ) : (
                <Navigate to="/employee" replace />
              )
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
