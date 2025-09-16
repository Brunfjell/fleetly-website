// src/hooks/useOnlineStatus.js
import { useState, useEffect } from "react";

export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOnlineTrue = () => setOnline(true);
    const setOnlineFalse = () => setOnline(false);

    window.addEventListener("online", setOnlineTrue);
    window.addEventListener("offline", setOnlineFalse);

    return () => {
      window.removeEventListener("online", setOnlineTrue);
      window.removeEventListener("offline", setOnlineFalse);
    };
  }, []);

  return online;
}
