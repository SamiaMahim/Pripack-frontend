import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import NavLabel from './NavLabel';
import { navButtonClass, navIconClass } from './navStyles';
import { useNotifications } from '../../../context/useNotifications';
import { NotificationItem, PushPrompt } from '../../Notifications/NotificationParts';

// Header bell for a logged-in customer or seller: unread badge and a
// dropdown with the latest notifications.
const NotificationBell = () => {
  const { enabled, unread, recent, recentError, loadRecent, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  // Load the list on open; close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    loadRecent();
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loadRecent]);

  if (!enabled) return null;
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        className={navButtonClass(open)}
      >
        <Bell className={navIconClass(open)} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <NavLabel>Notifications</NavLabel>
      </button>

      {open && (
        <div
          id={panelId}
          className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 z-50 rounded-xl bg-white border border-slate-100 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Notifications</h2>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-teal-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <PushPrompt className="m-3" />

          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
            {recent === null && !recentError && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner text-teal-500" aria-label="Loading" />
              </div>
            )}
            {recent === null && recentError && (
              <p role="alert" className="px-4 py-6 text-sm text-center text-slate-500">{recentError}</p>
            )}
            {recent && recent.length === 0 && (
              <p className="px-4 py-8 text-sm text-center text-slate-400">No notifications yet.</p>
            )}
            {recent && recent.map((n) => <NotificationItem key={n._id} n={n} onOpen={close} />)}
          </div>

          <Link
            to="/notifications"
            onClick={close}
            className="block px-4 py-2.5 text-sm font-semibold text-center text-teal-600 border-t border-slate-100 hover:bg-teal-50"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
