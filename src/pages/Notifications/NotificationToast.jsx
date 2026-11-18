import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../../context/useNotifications";

const TOAST_MS = 8000;

// Shows a push that arrived while the site was open, and follows clicks on
// background notifications (public/firebase-messaging-sw.js posts
// { type: "pripack:navigate", url } to an already open tab).
export default function NotificationToast() {
  const { toast, closeToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return undefined;
    const onMessage = (e) => {
      const url = e.data?.type === "pripack:navigate" ? e.data.url : null;
      if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) navigate(url);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(closeToast, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, closeToast]);

  if (!toast) return null;

  return (
    <div className="fixed right-4 bottom-20 lg:bottom-6 z-[60] w-80 max-w-[calc(100vw-2rem)] print:hidden">
      <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl bg-white border border-teal-100 shadow-xl p-4">
        <Bell className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {toast.title && <p className="font-semibold text-sm text-slate-800">{toast.title}</p>}
          {toast.body && <p className="text-sm text-slate-500 mt-0.5 line-clamp-3">{toast.body}</p>}
          {toast.url && (
            <Link to={toast.url} onClick={closeToast} className="btn-gradient !px-3 !py-1.5 !text-xs mt-2">
              View
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={closeToast}
          aria-label="Close"
          className="p-1 rounded-full text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
