import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export function useIdleLogout({
  idleTime = 5 * 60 * 1000,  
  warningTime = 3 * 60 * 1000 
}) {
  const { logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);

  const resetTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);

    logoutTimer.current = setTimeout(() => {
      logout();
    }, idleTime);
  };

  useEffect(() => {
    resetTimers();

    const handleActivity = () => {
      resetTimers();
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));


    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, []);

  return { showWarning, resetTimers };
}
