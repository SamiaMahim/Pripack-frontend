import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../pages/Auth/Authprovider";
import { customerToken, notificationPath, notificationsRequest } from "../Utils/notificationsApi";
import { isPushAvailable, notificationPermission, onForegroundMessage } from "../Utils/firebase";
import { syncPushToken } from "../Utils/push";
import { NotificationContext } from "./useNotifications";

// The signed-in customer's / seller's notifications (navbar bell,
// /notifications page) and web push: unread count polled every minute while
// the tab is visible, device token registered once notifications are allowed,
// and pushes that arrive while the site is open shown as a toast.
//
// The customer token lasts an hour and the app keeps the user "logged in"
// after it expires, so a 401 just stops polling quietly (no logout). A new
// login brings a new token, which starts everything again.

const POLL_MS = 60_000;
const RECENT_LIMIT = 6;
const PROMPT_KEY = "pushPromptDismissed";

function readDismissed() {
  try {
    return localStorage.getItem(PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

export function NotificationProvider({ children }) {
  const { user, token } = useContext(AuthContext);
  // Keyed on the session token so a re-login (new token) restarts polling.
  const sessionKey = user ? token || customerToken() || null : null;

  const [unread, setUnread] = useState(0);
  // Recent list for the bell: null until first loaded.
  const [recent, setRecent] = useState(null);
  const [recentError, setRecentError] = useState("");
  const [expired, setExpired] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [permission, setPermission] = useState(notificationPermission);
  const [promptDismissed, setPromptDismissed] = useState(readDismissed);
  const [toast, setToast] = useState(null);

  // Responses for a previous session are dropped.
  const sessionRef = useRef(sessionKey);
  const expiredRef = useRef(false);

  // Runs a request for the current session. Resolves to undefined when the
  // session changed meanwhile or has expired (401 stops further calls).
  const call = useCallback(async (path, method, body) => {
    const forSession = sessionRef.current;
    if (!forSession || expiredRef.current) return undefined;
    try {
      const data = await notificationsRequest(path, method, body, forSession);
      return sessionRef.current === forSession ? data : undefined;
    } catch (err) {
      if (sessionRef.current !== forSession) return undefined;
      if (err.status === 401) {
        expiredRef.current = true;
        setExpired(true);
      }
      throw err;
    }
  }, []);

  const refreshCount = useCallback(async () => {
    try {
      const data = await call("/notifications/me?limit=1");
      if (data) setUnread(Number(data.unread) || 0);
    } catch {
      // keep the last count; the next poll tries again (unless 401)
    }
  }, [call]);

  const loadRecent = useCallback(async () => {
    try {
      const data = await call(`/notifications/me?limit=${RECENT_LIMIT}`);
      if (!data) return;
      setRecent(Array.isArray(data.items) ? data.items : []);
      setUnread(Number(data.unread) || 0);
      setRecentError("");
    } catch (err) {
      setRecentError(err.message);
    }
  }, [call]);

  // Reset on login / logout / new session, then poll while visible.
  useEffect(() => {
    sessionRef.current = sessionKey;
    expiredRef.current = false;
    setExpired(false);
    setUnread(0);
    setRecent(null);
    setRecentError("");
    setToast(null);
    if (!sessionKey) return undefined;

    refreshCount();
    const tick = () => {
      if (expiredRef.current) {
        clearInterval(timer);
        return;
      }
      if (document.visibilityState === "visible") refreshCount();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [sessionKey, refreshCount]);

  // Web push: register the token silently if already allowed (never prompt
  // here) and listen for pushes that arrive while the site is open.
  useEffect(() => {
    if (!sessionKey) return undefined;
    let cancelled = false;
    let unsubscribe = null;
    isPushAvailable().then(async (ok) => {
      if (cancelled) return;
      setPushAvailable(ok);
      if (!ok) return;
      setPermission(notificationPermission());
      if (notificationPermission() === "granted") syncPushToken();
      const off = await onForegroundMessage((payload) => {
        const title = payload?.notification?.title || payload?.data?.title || "";
        const body = payload?.notification?.body || payload?.data?.message || payload?.data?.body || "";
        setToast({ id: Date.now(), title, body, url: notificationPath(payload) });
        loadRecent();
      });
      if (cancelled) off();
      else unsubscribe = off;
    });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [sessionKey, loadRecent]);

  const markRead = useCallback(async (n) => {
    if (!n || n.isRead) return;
    setRecent((list) => list && list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await call(`/notifications/${n._id}`, "PATCH", { isRead: true });
    } catch {
      refreshCount();
    }
  }, [call, refreshCount]);

  const markAllRead = useCallback(async () => {
    setRecent((list) => list && list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await call("/notifications/read-all", "POST", {});
    } catch {
      loadRecent();
    }
  }, [call, loadRecent]);

  const remove = useCallback(async (n) => {
    setRecent((list) => list && list.filter((x) => x._id !== n._id));
    if (!n.isRead) setUnread((c) => Math.max(0, c - 1));
    try {
      await call(`/notifications/${n._id}`, "DELETE");
    } catch (err) {
      refreshCount();
      throw err;
    }
  }, [call, refreshCount]);

  // Called from a click (browsers only show the prompt for a user gesture).
  const enablePush = useCallback(async () => {
    if (!pushAvailable) return "unsupported";
    let result = notificationPermission();
    try {
      if (result === "default") result = await Notification.requestPermission();
    } catch {
      result = notificationPermission();
    }
    setPermission(result);
    if (result === "granted") await syncPushToken();
    return result;
  }, [pushAvailable]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {
      // storage blocked: hidden for this visit only
    }
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const value = useMemo(() => ({
    enabled: Boolean(sessionKey),
    expired,
    unread,
    recent,
    recentError,
    call,
    loadRecent,
    refreshCount,
    markRead,
    markAllRead,
    remove,
    pushAvailable,
    permission,
    showPushPrompt: pushAvailable && permission === "default" && !promptDismissed && !expired,
    enablePush,
    dismissPrompt,
    toast,
    closeToast,
  }), [sessionKey, expired, unread, recent, recentError, call, loadRecent, refreshCount, markRead, markAllRead, remove, pushAvailable, permission, promptDismissed, enablePush, dismissPrompt, toast, closeToast]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
