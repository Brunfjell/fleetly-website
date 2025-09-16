import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { canAccess } from "../utils/roleUtils";

export default function RoleGuard({ allowedRoles, children, redirect = "/auth/login" }) {
  const { role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!role || !canAccess(role, allowedRoles)) {
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  return children;
}

