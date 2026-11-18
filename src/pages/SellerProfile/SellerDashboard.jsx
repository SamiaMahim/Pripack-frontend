/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { base_url } from "../../config/config";
import { partnerRequest, taka, STATUS_STYLES } from "../../Utils/partnerApi";

const StatCard = ({ label, value, accent }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${accent || "text-slate-800"}`}>{value}</p>
  </div>
);

const SellerDashboard = ({ seller, onNavigate }) => {
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      partnerRequest("/seller/orders").catch(() => ({ orders: [] })),
      fetch(`${base_url}/sellerchat/${seller._id}`).then((r) => r.json()).catch(() => []),
    ]).then(([ordersRes, chatRes]) => {
      setOrders(Array.isArray(ordersRes.orders) ? ordersRes.orders : []);
      setConversations(Array.isArray(chatRes) ? chatRes : []);
      setLoading(false);
    });
  }, [seller._id]);

  if (loading) {
    return <div className="w-full py-10 text-center text-gray-500">Loading dashboard...</div>;
  }

  const active = orders.filter((o) => o.status !== "Cancelled");
  const pending = orders.filter((o) => o.status === "Pending Verification").length;
  const earned = orders.filter((o) => o.status === "Delivered").reduce((s, o) => s + (o.totals?.profit || 0), 0);
  const expected = active.filter((o) => o.status !== "Delivered").reduce((s, o) => s + (o.totals?.profit || 0), 0);
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const recentOrders = orders.slice(0, 5);
  const recentConversations = [...conversations]
    .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
    .slice(0, 5);

  return (
    <div className="w-full">

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Orders" value={active.length} />
        <StatCard label="Awaiting Verification" value={pending} accent="text-amber-600" />
        <StatCard label="Profit Earned" value={taka(earned)} accent="text-green-600" />
        <StatCard label="Profit In Progress" value={taka(expected)} accent="text-sky-600" />
        <StatCard label="Unread Messages" value={unreadMessages} accent={unreadMessages > 0 ? "text-red-600" : "text-slate-800"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">Recent Orders</p>
            <button onClick={() => onNavigate?.("orders")} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No orders yet.</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order._id} className="flex justify-between items-center px-4 py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-800">#{order.referenceCode}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {order.orderFor === "self" ? "For myself" : order.customer?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{taka(order.orderFor === "self" ? order.totals.cost : order.totals.selling)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"}`}>{order.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">Recent Messages</p>
            <button onClick={() => onNavigate?.("messages")} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No messages yet.</p>
          ) : (
            recentConversations.map((c) => (
              <div key={c._id} className="flex justify-between items-center px-4 py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.bName}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[220px]">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
