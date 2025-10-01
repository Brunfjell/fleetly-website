import { useIdleLogout } from "../hooks/useIdleLogout";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function IdleWatcher() {
  const { user } = useAuth();
  const { showWarning, resetTimers } = useIdleLogout({});
  const [secondsLeft, setSecondsLeft] = useState(120); 

  useEffect(() => {
    if (showWarning) {
      setSecondsLeft(120); 
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showWarning]);

  if (!user) return null;
  if (!showWarning) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-lg font-bold mb-2">Are you still there?</h2>
        <p className="mb-4">You’ll be logged out in 2 minutes unless you confirm.</p>

        <span className="countdown text-2xl">
          <span style={{ "--value": minutes }} aria-live="polite">
            {minutes}
          </span>
          m{" "}
          <span style={{ "--value": seconds }} aria-live="polite">
            {seconds}
          </span>
          s
        </span>

        <div className="mt-4">
          <button
            onClick={resetTimers}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Yes, I’m here
          </button>
        </div>
      </div>
    </div>
  );
}
