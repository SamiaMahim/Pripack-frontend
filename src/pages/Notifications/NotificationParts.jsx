import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { BellRing, X } from "lucide-react";
import { useNotifications } from "../../context/useNotifications";
import { notificationPath, timeAgo } from "../../Utils/notificationsApi";

// One notification row. Clicking marks it read and opens its data.url.
export function NotificationItem({ n, onOpen, children }) {
  const { markRead } = useNotifications();
  const navigate = useNavigate();
  const path = notificationPath(n);

  function open() {
    markRead(n);
    onOpen?.(n);
    if (path) navigate(path);
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${n.isRead ? "bg-white" : "bg-teal-50/60"}`}>
      <span
        aria-hidden="true"
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? "bg-transparent" : "bg-teal-500"}`}
      />
      <button type="button" onClick={open} className="min-w-0 flex-1 text-left group">
        <span className={`block text-sm leading-snug group-hover:text-teal-600 ${n.isRead ? "text-slate-700" : "font-semibold text-slate-900"}`}>
          {n.title}
          {!n.isRead && <span className="sr-only"> (unread)</span>}
        </span>
        {n.message && <span className="block text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</span>}
        <time dateTime={n.createdAt} className="block text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</time>
      </button>
      {children}
    </div>
  );
}

NotificationItem.propTypes = {
  n: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    isRead: PropTypes.bool,
    createdAt: PropTypes.string,
    data: PropTypes.object,
  }).isRequired,
  onOpen: PropTypes.func,
  children: PropTypes.node,
};

// "Turn on notifications" card. Permission is only requested on click,
// never on page load.
export function PushPrompt({ className = "" }) {
  const { showPushPrompt, enablePush, dismissPrompt } = useNotifications();
  const [busy, setBusy] = useState(false);
  if (!showPushPrompt) return null;

  async function enable() {
    setBusy(true);
    try {
      await enablePush();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3 ${className}`}>
      <BellRing className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700">Turn on notifications to hear about your order updates.</p>
        <button type="button" onClick={enable} disabled={busy} className="btn-gradient !px-3 !py-1.5 !text-xs mt-2">
          {busy && <span className="loading loading-spinner loading-xs" />} Turn on
        </button>
      </div>
      <button
        type="button"
        onClick={dismissPrompt}
        aria-label="Dismiss"
        className="p-1 rounded-full text-teal-600 hover:bg-teal-100 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

PushPrompt.propTypes = {
  className: PropTypes.string,
};
