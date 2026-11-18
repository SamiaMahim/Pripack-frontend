import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base_url } from "../../config/config";

const NEXT_STATUS = {
  Placed: "On Transit",
  Confirmed: "On Transit",
  "On Making": "On Transit",
  "On Transit": "Delivered",
};

const RiderOrderStatus = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchOrder = () => {
    setLoading(true);
    fetch(`${base_url}/getorder/${id}`)
      .then((r) => r.json())
      .then((data) => setOrder(data.order || null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    setMessage(null);
    try {
      const res = await fetch(`${base_url}/order/riderstatus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Marked as "${status}"` });
        fetchOrder();
      } else {
        setMessage({ type: "error", text: data.message || "Update failed." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading order...
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center text-red-400 text-sm px-6 text-center">
      Order not found. Double-check the QR code or ask support.
    </div>
  );

  const orderNo = `#${order._id.slice(-8).toUpperCase()}`;
  const isCOD = (order.paymentMethod || "").toLowerCase().includes("delivery");
  const isFinal = order.currentStatus === "Delivered" || order.currentStatus === "Cancelled";
  // Orders made by a supplier: the first scan is the pickup at the supplier,
  // allowed once the supplier has requested it.
  const atSupplier = Boolean(order.supplier) && order.supplierStatus !== "Picked Up" && !isFinal;
  const pickupReady = atSupplier && order.supplierStatus === "Pickup Requested";
  const nextStatus = atSupplier ? (pickupReady ? "On Transit" : null) : NEXT_STATUS[order.currentStatus];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="bg-gray-900 text-white px-5 py-4">
          <p className="text-xs text-gray-400">Order</p>
          <p className="font-mono font-bold text-lg">{orderNo}</p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Deliver To</p>
            <p className="font-bold text-gray-900">{order.buyerName}</p>
            <p className="text-sm text-gray-600">{order.buyerPhone}</p>
            <p className="text-sm text-gray-600 leading-snug mt-0.5">{order.buyerAddress}</p>
          </div>

          {order.delivery && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 flex justify-between text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{order.delivery.area}</span>
              <span>{order.delivery.period}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Items</p>
              <p className="font-semibold text-gray-800">{order.cartItems?.length || 0} product(s)</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {isCOD ? "Collect (COD)" : "Payment"}
              </p>
              <p className={`font-black ${isCOD ? "text-red-600" : "text-green-600"}`}>
                {isCOD ? `৳${order.totalPrice}` : "Prepaid"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Current Status</p>
            <span className="inline-block text-sm font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {order.currentStatus}
            </span>
          </div>

          {message && (
            <div className={`text-sm rounded-xl px-3 py-2 ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          {atSupplier && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Pick Up From</p>
              <p className="font-bold text-gray-900">{order.supplier.name}</p>
              {order.supplier.phone && <p className="text-sm text-gray-600">{order.supplier.phone}</p>}
              {order.supplier.address && <p className="text-sm text-gray-600 leading-snug">{order.supplier.address}</p>}
              {!pickupReady && (
                <p className="text-xs text-amber-700 mt-1">The supplier hasn&apos;t marked this order ready for pickup yet.</p>
              )}
            </div>
          )}

          {!isFinal && nextStatus && (
            <button
              onClick={() => updateStatus(nextStatus)}
              disabled={updating}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-base hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {updating ? "Updating..." : pickupReady ? "Picked up from supplier" : `Mark as "${nextStatus}"`}
            </button>
          )}

          {isFinal && (
            <p className="text-center text-sm text-gray-400 py-2">This order is already {order.currentStatus.toLowerCase()}.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderOrderStatus;
