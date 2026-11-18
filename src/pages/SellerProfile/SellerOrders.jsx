import { useEffect, useState } from "react";
import { partnerRequest, taka, STATUS_STYLES } from "../../Utils/partnerApi";

const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await partnerRequest("/seller/orders");
      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="py-10 text-center text-gray-500">Loading orders...</div>;
  if (error) return <div className="py-10 text-center text-red-500">{error}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-4">
        <button onClick={fetchOrders} className="btn-simple px-3 py-1.5">Refresh</button>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order._id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === order._id ? null : order._id)}
                className="w-full flex flex-wrap justify-between items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">#{order.referenceCode}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(order.createdAt)} · {order.orderFor === "self" ? "For myself" : order.customer?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {order.orderFor === "customer" && (
                    <span className={`text-sm font-semibold ${order.totals.profit < 0 ? "text-red-600" : "text-green-600"}`}>
                      Profit {taka(order.totals.profit)}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"}`}>
                    {order.status}
                  </span>
                  {order.supplierStatus && order.status === "Transferred to Supplier" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">{order.supplierStatus}</span>
                  )}
                </div>
              </button>

              {open === order._id && (
                <div className="border-t border-slate-100 px-4 py-3 text-sm">
                  {order.orderFor === "customer" && (
                    <p className="text-slate-600 mb-2">
                      Customer: {order.customer.name} · {order.customer.phone} · {order.customer.address}
                    </p>
                  )}
                  {order.supplier && <p className="text-slate-600 mb-2">Supplier: {order.supplier.name}</p>}

                  <div className="overflow-x-auto">
                    <table className="table table-xs">
                      <thead>
                        <tr><th>Product</th><th>Qty</th><th>Your price</th><th>Selling price</th><th>Profit</th></tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i}>
                            <td>{item.productName}<span className="text-slate-400"> · {item.variantLabel || "Standard"}</span></td>
                            <td>{item.units}</td>
                            <td>{taka(item.sellerPrice)}</td>
                            <td>{taka(item.sellingPrice)}</td>
                            <td className={item.profit < 0 ? "text-red-600" : "text-green-600"}>{taka(item.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span>You pay: <b>{taka(order.totals.cost)}</b></span>
                    {order.orderFor === "customer" && <span>Customer pays: <b>{taka(order.totals.selling)}</b></span>}
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">History</p>
                    {order.statusHistory.map((h, i) => (
                      <p key={i} className="text-xs text-slate-500">{formatDate(h.date)} · {h.status}{h.note ? ` · ${h.note}` : ""}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
