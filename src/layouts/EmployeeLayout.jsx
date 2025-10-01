import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import IdleWatcher from "../components/IdleWatcher";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { Footer } from "../components/Footer";

export default function EmployeeLayout() {
  const { role, logout, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { label: "Dashboard", to: "/employee", end: true },
    { label: "Trips", to: "/employee/trips" },
    { label: "Expenses", to: "/employee/expenses" },
  ];

  return (
    <><div className="drawer drawer-mobile h-screen">
      <input id="employee-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <div className="navbar bg-base-100 shadow-2xl w-full">
          <div className="flex-none lg:hidden flex items-center gap-2">
            <label htmlFor="employee-drawer" className="btn btn-square btn-ghost">
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

          <div className="mx-2 flex-1 px-2 font-bold">Fleetly Employee</div>

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
              className="btn btn-error btn-sm ml-2 text-white"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-base-200">
          <Outlet context={{ currentUserId: user?.id }} />
        </main>
      </div>

      <div className="drawer-side z-10">
        <label htmlFor="employee-drawer" className="drawer-overlay"></label>
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
                className="btn btn-error text-white"
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
    </div>
    <Footer />
    <IdleWatcher />
    </>
  );
}
