import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base_url } from "../../config/config";
import { clearCart } from '../../Utils/cartApi';

const PaymentGateway = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null); // track which was copied

  const { orderId, orderSummary } = state || {};

  useEffect(() => {
    if (!orderId) { navigate("/"); return; }
    fetch(`${base_url}/payment`)
      .then(r => r.json())
      .then(data => {
        setPaymentMethods(data);
        if (data.length > 0) setSelectedMethod(data[0]);
      })
      .catch(err => console.error("Error fetching payment methods:", err));
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) { setError("Please select a payment method."); return; }
    if (!transactionId.trim()) { setError("Please enter your transaction ID."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${base_url}/updateorderpayment/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: selectedMethod.method,
          paymentNumber: selectedMethod.number,
          transactionId: transactionId.trim(),
          paymentStatus: "Pending Verification",
        }),
      });
      const data = await res.json();
      if (data.success) { 
        navigate("/profile"); 
        localStorage.removeItem("buyNowItem");
        clearCart();
      
      }
      else setError("Failed to update payment. Please try again.");
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-4">

       
        <div className="text-center mb-1">
          <p className="text-[11px] font-bold tracking-[0.2em] text-teal-500 uppercase mb-1">Secure Payment</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Complete Your Order</h1>
        </div>

        
        {orderSummary && (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-wrap gap-5 shadow-sm">
            <div className="flex-1 min-w-[80px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Subtotal</p>
              <p className="text-gray-800 font-semibold text-sm">৳{orderSummary.subtotal?.toFixed(2)}</p>
            </div>
            <div className="flex-1 min-w-[80px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Delivery</p>
              <p className="text-gray-800 font-semibold text-sm">৳{orderSummary.deliveryCharge?.toFixed(2)}</p>
            </div>
            {orderSummary.discount > 0 && (
              <div className="flex-1 min-w-[80px]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Discount</p>
                <p className="text-teal-600 font-semibold text-sm">− ৳{orderSummary.discount?.toFixed(2)}</p>
              </div>
            )}
            <div className="flex-1 min-w-[80px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Total</p>
              <p className="text-teal-600 font-black text-xl">৳{orderSummary.totalPrice?.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-3">Select Payment Method</p>
          <div className="flex flex-col gap-2">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod?._id === method._id;
              return (
                <button
                  key={method._id}
                  onClick={() => setSelectedMethod(method)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-200 ${
                    isSelected
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-200 hover:border-teal-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${isSelected ? "text-teal-700" : "text-gray-800"}`}>
                          {method.method}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-teal-400 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-600">{method.number}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(method.number, method._id); }}
                          className={`text-[10px] font-semibold transition ${
                            copied === method._id ? "text-teal-500" : "text-gray-400 hover:text-teal-500"
                          }`}
                        >
                          {copied === method._id ? "✓ copied" : "copy"}
                        </button>
                      </div>

                      {method.extradetails && (
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{method.extradetails}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction ID */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <label className="flex flex-col gap-2">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Transaction / TrxID</p>
            <input
              type="text"
              value={transactionId}
              onChange={e => { setTransactionId(e.target.value); setError(""); }}
              placeholder="Enter your transaction ID here"
              className="bg-gray-50 border border-gray-300 focus:border-teal-400 outline-none rounded-xl px-4 py-3 text-gray-800 text-sm placeholder:text-gray-300 transition"
            />
            <p className="text-gray-400 text-xs">Copy the TrxID from your payment app after sending money.</p>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleConfirmPayment}
          disabled={loading}
          className="btn-gradient w-full py-4 text-base"
        >
          {loading ? "Processing..." : "Payment Done →"}
        </button>

        <p className="text-center text-gray-400 text-xs pb-6">
          Your payment will be verified by our team within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default PaymentGateway;