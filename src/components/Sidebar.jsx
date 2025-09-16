import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/roleUtils";

export default function Sidebar() {
  const { role } = useAuth();

  const menuItems = [];
  if (role === ROLES.ADMIN) {
    menuItems.push(
      { label: "Dashboard", to: "/admin", end: true },
      { label: "Employees", to: "/admin/employees" },
      { label: "Vehicles", to: "/admin/vehicles" },
      { label: "Trips", to: "/admin/trips" },
      { label: "Expenses", to: "/admin/expenses" }
    );
  } else if (role === ROLES.DRIVER) {
    menuItems.push(
      { label: "Trip Interface", to: "/driver", end: true },
      { label: "My Trips", to: "/driver/trips" },
      { label: "My Expenses", to: "/driver/expenses" }
    );
  } else if (role === ROLES.EMPLOYEE) {
    menuItems.push(
      { label: "Trip Request", to: "/employee", end: true },
      { label: "My Trips", to: "/employee/trips" },
      { label: "My Expenses", to: "/employee/expenses" }
    );
  }

  return (
    <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      {menuItems.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end || false}
            className={({ isActive }) =>
              `rounded ${isActive ? "bg-primary text-primary-content" : ""}`
            }
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
