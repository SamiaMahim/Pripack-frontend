import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { AuthContext } from "../Auth/Authprovider";
import { useNotifications } from "../../context/useNotifications";
import { NotificationItem, PushPrompt } from "./NotificationParts";

const LIMIT = 20;

// Every notification for the logged-in customer or seller, newest first.
const NotificationsPage = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const { enabled, expired, unread, call, markAllRead, remove, recent } = useNotifications();
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async (nextPage) => {
    const id = ++requestRef.current;
    setError("");
    if (nextPage > 1) setLoadingMore(true);
    try {
      const data = await call(`/notifications/me?page=${nextPage}&limit=${LIMIT}${unreadOnly ? "&unread=true" : ""}`);
      if (id !== requestRef.current || !data) return;
      const list = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => (nextPage > 1 && prev ? [...prev, ...list.filter((n) => !prev.some((p) => p._id === n._id))] : list));
      setPage(nextPage);
      setPages(Number(data.pages) || 1);
    } catch (err) {
      if (id === requestRef.current) setError(err.message);
    } finally {
      if (id === requestRef.current) setLoadingMore(false);
    }
  }, [call, unreadOnly]);

  useEffect(() => {
    setItems(null);
    if (enabled) load(1);
  }, [enabled, load]);

  // Read state changed from the bell or a toast: mirror it here.
  useEffect(() => {
    if (!recent) return;
    setItems((list) => list && list.map((n) => {
      const fresh = recent.find((r) => r._id === n._id);
      return fresh && fresh.isRead !== n.isRead ? { ...n, isRead: fresh.isRead } : n;
    }));
  }, [recent]);

  async function readAll() {
    setItems((list) => list && (unreadOnly ? [] : list.map((n) => ({ ...n, isRead: true }))));
    await markAllRead();
  }

  async function removeItem(n) {
    setItems((list) => list && list.filter((x) => x._id !== n._id));
    try {
      await remove(n);
    } catch {
      load(1);
    }
  }

  const sessionGone = !authLoading && (!enabled || expired);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 lg:pt-28 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Notifications</h1>
        {enabled && !expired && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-success"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
              Unread only
            </label>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="btn-simple !px-3 !py-1.5 !text-xs">
                Mark all read
              </button>
            )}
          </div>
        )}
      </div>

      {sessionGone ? (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-8 text-center">
          <p className="text-slate-600">
            {expired ? "Your session has expired. Please log in again to see your notifications." : "Please log in to see your notifications."}
          </p>
          <NavLink to="/login" className="btn-gradient mt-4">Login</NavLink>
        </div>
      ) : (
        <>
          <PushPrompt className="mb-4" />

          {items === null && !error && (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg text-teal-500" aria-label="Loading" />
            </div>
          )}
          {items === null && error && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-8 text-center">
              <p role="alert" className="text-slate-600">{error}</p>
              <button type="button" onClick={() => load(1)} className="btn-simple mt-4">Try again</button>
            </div>
          )}
          {items && items.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-8 text-center text-slate-500">
              {unreadOnly ? "No unread notifications." : "No notifications yet."}
            </div>
          )}
          {items && items.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
              {items.map((n) => (
                <NotificationItem
                  key={n._id}
                  n={n}
                  onOpen={() => setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))}
                >
                  <button
                    type="button"
                    onClick={() => removeItem(n)}
                    aria-label="Delete notification"
                    title="Delete"
                    className="p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </NotificationItem>
              ))}
            </div>
          )}
          {items && error && <p role="alert" className="text-sm text-red-500 mt-3">{error}</p>}
          {items && page < pages && (
            <div className="text-center mt-6">
              <button type="button" onClick={() => load(page + 1)} disabled={loadingMore} className="btn-simple">
                {loadingMore && <span className="loading loading-spinner loading-xs" />} Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
