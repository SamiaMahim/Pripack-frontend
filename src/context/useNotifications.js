import { createContext, useContext } from "react";

export const NotificationContext = createContext(null);

// Notification state from <NotificationProvider> (src/context/NotificationContext.jsx).
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
