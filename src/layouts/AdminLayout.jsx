import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { ROLES } from "../utils/roleUtils";
import { Footer } from "../components/Footer";

export default function AdminLayout() {
  const { role, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [];
  if (role === ROLES.ADMIN) {
    menuItems.push(
      { label: "Dashboard", to: "/admin", end: true },
      { label: "Employees", to: "/admin/employees" },
      { label: "Vehicles", to: "/admin/vehicles" },
      { label: "Trips", to: "/admin/trips" },
      { label: "Expenses", to: "/admin/expenses" }
    );
  }

  return (
    <><div className="drawer drawer-mobile h-screen">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <div className="navbar bg-base-100 shadow-2xl w-full">
          <div className="flex-none lg:hidden flex items-center gap-2">
            <label htmlFor="admin-drawer" className="btn btn-square btn-ghost">
              <FiMenu size={20} />
            </label>
            <ThemeToggle />
            <button
              className="btn btn-ghost btn-sm ml-2"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </div>

          <div className="mx-2 flex-1 px-2 font-bold">Fleetly Admin</div>

          <div className="hidden flex-none lg:flex items-center gap-2">
            <ul className="menu menu-horizontal">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end || false}
                    className={({ isActive }) => `rounded px-2 py-1 ${isActive ? "bg-primary text-primary-content" : ""}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ThemeToggle />
            <button
              className="btn btn-error btn-sm ml-2"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-base-100">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="admin-drawer" className="drawer-overlay"></label>
        <Sidebar role={role} />
      </div>

      {showLogoutModal && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Logout</h3>
            <p className="py-4">Are you sure you want to logout?</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                } }
              >
                Logout
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div><Footer /></>
  );
}
