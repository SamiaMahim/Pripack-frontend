import { useState, useEffect, useContext, useRef } from 'react';
import Swal from "sweetalert2";
import {
  Package, Star, Calendar, CheckCircle2, Clock, Truck,
  MapPin, CreditCard, Tag, Receipt, Upload, X, Image as ImageIcon, ChevronDown
} from 'lucide-react';
import { AuthContext } from '../Auth/Authprovider';
import { base_url } from '../../config/config';
import User from './User';
import { ProfileAd } from '../home/Ads/Ads';
import "../../styles/profile.css";
import { useNavigate } from "react-router-dom";

const STATUS_FLOW = [
  { key: "Placed",     icon: CheckCircle2, label: "Placed"     },
  { key: "Confirmed",  icon: CheckCircle2, label: "Confirmed"  },
  { key: "On Making",  icon: Clock,        label: "Preparing"  },
  { key: "On Transit", icon: Truck,        label: "In Transit" },
  { key: "Delivered",  icon: Package,      label: "Delivered"  },
];

const PAYMENT_STATUS_COLOR = {
  "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200",
  "Paid":                 "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Failed":               "bg-red-50 text-red-700 border-red-200",
};

const ORDER_STATUS_COLOR = {
  "Placed":     "bg-blue-50 text-blue-700",
  "Confirmed":  "bg-indigo-50 text-indigo-700",
  "On Making":  "bg-orange-50 text-orange-700",
  "On Transit": "bg-purple-50 text-purple-700",
  "Delivered":  "bg-emerald-50 text-emerald-700",
};

const generateInvoicePDF = (order) => {
  window.open(`${base_url}/invoicepdf/${order._id}`, '_blank');
};

const Section = ({ title, icon, defaultOpen = false, children, accent }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={` border overflow-hidden ${accent || 'border-slate-100'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
          {icon}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [orders,          setOrders]          = useState([]);
  const [ordersLoading,   setOrdersLoading]   = useState(true);
  const [activeTab,       setActiveTab]       = useState(null);
  const [showReviewForm,  setShowReviewForm]  = useState(false);
  const [reviewText,      setReviewText]      = useState("");
  const [rating,          setRating]          = useState(0);
  const [hoverRating,     setHoverRating]     = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewImages,    setReviewImages]    = useState([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (authLoading) return; if (user === null) navigate("/"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.userId) { setOrdersLoading(false); return; }
    const fetchOrders = async () => {
      try {
        const res  = await fetch(`${base_url}/getorders/${user.userId}`);
        const data = await res.json();
        setOrders(data?.orders || []);
      } catch { setOrders([]); } finally { setOrdersLoading(false); }
    };
    fetchOrders();
  }, [user]);

  // Delivered items the customer hasn't reviewed yet — one entry per product per order.
  const pendingReviews = orders
    .filter(o => o.currentStatus === "Delivered")
    .flatMap(o => {
      const seen = new Set(o.reviewedProductIds || []);
      return (o.cartItems || []).filter(item => {
        if (!item.productId || seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
      }).map(item => ({ ...item, orderId: o._id, order: o }));
    });

  // Prompt once per browser session so the popup doesn't reappear on every visit to the profile.
  useEffect(() => {
    if (ordersLoading || pendingReviews.length === 0) return;
    if (sessionStorage.getItem("reviewPromptShown")) return;
    sessionStorage.setItem("reviewPromptShown", "1");
    openReview(pendingReviews[0], true);
  }, [ordersLoading, pendingReviews.length]);

  const markReviewed = (orderId, productId) => {
    setOrders(prev => prev.map(o => o._id === orderId
      ? { ...o, reviewedProductIds: [...(o.reviewedProductIds || []), productId] }
      : o));
  };

  // fromPrompt: opened by the login prompt, so after submitting we move on to the next unreviewed item.
  const openReview = (product, fromPrompt = false) => {
    setSelectedProduct({ ...product, fromPrompt });
    setShowReviewForm(true);
  };

  const getStatusDate = (history, status) => {
    const found = [...(history || [])].reverse().find(h => h.status === status);
    if (!found) return null;
    return new Date(found.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  };
  const getStatusIndex = (statusHistory) => {
    const keys = STATUS_FLOW.map(s => s.key);
    let max = -1;
    statusHistory?.forEach(h => { const i = keys.indexOf(h.status); if (i > max) max = i; });
    return max;
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setReviewImages(prev => [...prev, ...files.filter(f => f.type.startsWith("image/")).slice(0, 5 - prev.length)]);
  };
  const removeImage = (idx) => setReviewImages(prev => prev.filter((_, i) => i !== idx));

  const handleReviewSubmit = async () => {
    if (!rating || !reviewText.trim()) {
      Swal.fire({ icon: "warning", title: "Missing details", text: "Please provide a rating and review text" });
      return;
    }
    if (!selectedProduct || !user) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId",    selectedProduct.productId);
      formData.append("orderId",      selectedProduct.orderId);
      formData.append("rating",       rating);
      formData.append("message",      reviewText);
      formData.append("customerId",   user.userId);
      formData.append("customerName", user.name);
      formData.append("createdAt",    new Date().toISOString());
      reviewImages.forEach(img => formData.append("images", img));
      const res = await fetch(`${base_url}/addreview`, { method: "POST", body: formData });
      if (!res.ok && res.status !== 409) throw new Error();
      const remaining = pendingReviews.filter(p =>
        !(p.orderId === selectedProduct.orderId && p.productId === selectedProduct.productId));
      markReviewed(selectedProduct.orderId, selectedProduct.productId);
      closeReview();
      await Swal.fire({ icon: "success", title: "Review submitted successfully", showConfirmButton: false, timer: 2000 });
      if (selectedProduct.fromPrompt && remaining.length > 0) openReview(remaining[0], true);
    } catch {
      Swal.fire({ icon: "error", title: "Failed to submit review" });
    } finally { setSubmitting(false); }
  };

  const closeReview = () => {
    setShowReviewForm(false); setReviewText(""); setRating(0);
    setHoverRating(0); setSelectedProduct(null); setReviewImages([]);
  };

  if (authLoading || ordersLoading) {
    return (
      <div className="pmain">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Loading your profile…</p>
          </div>
        </div>
      </div>
    );
  }

  const activeOrder = orders.find(o => o._id === (activeTab ?? orders[0]?._id));

  return (
    <div className="pmain">
      <div className="psmain">
        <div className="lg:mr-5 flex-shrink-0 w-full lg:w-[320px]">
          <User />
          <ProfileAd />
        </div>

        <div className="flex-1 min-w-0">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No orders yet</h3>
              <p className="text-slate-500 text-sm">Start shopping to see your orders here.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 px-1 mt-5 lg:mt-0">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  My Orders
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                    {orders.length}
                  </span>
                </h2>

                {/* Desktop tabs */}
                <div className="hidden sm:flex gap-2 flex-wrap">
                  {orders.map(order => {
                    const isActive = (activeTab ?? orders[0]._id) === order._id;
                    return (
                      <button key={order._id} onClick={() => setActiveTab(order._id)}
                        className={`flex flex-col items-start px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                          isActive ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <span className={`text-xs font-mono font-bold ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                          #{order.referenceCode}
                        </span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${ORDER_STATUS_COLOR[order.currentStatus] || "bg-slate-100 text-slate-500"}`}>
                          {order.currentStatus}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile dropdown */}
                <div className="relative sm:hidden">
                  <button onClick={() => setShowOrderPicker(v => !v)}
                    className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white border-2 border-indigo-200 rounded-xl text-sm font-semibold text-indigo-700 shadow-sm"
                  >
                    <span className="font-mono text-xs">#{activeOrder?.referenceCode}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${ORDER_STATUS_COLOR[activeOrder?.currentStatus] || "bg-slate-100 text-slate-500"}`}>
                      {activeOrder?.currentStatus}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showOrderPicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showOrderPicker && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                      {orders.map(order => (
                        <button key={order._id}
                          onClick={() => { setActiveTab(order._id); setShowOrderPicker(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors ${(activeTab ?? orders[0]._id) === order._id ? 'bg-indigo-50' : ''}`}
                        >
                          <span className="text-xs font-mono font-bold text-slate-600">#{order.referenceCode}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[order.currentStatus] || "bg-slate-100 text-slate-500"}`}>
                            {order.currentStatus}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeOrder && (
                <OrderCard
                  key={activeOrder._id}
                  order={activeOrder}
                  getStatusDate={getStatusDate}
                  getStatusIndex={getStatusIndex}
                  onReview={(product) => openReview(product)}
                  onGenerateInvoice={generateInvoicePDF}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeReview(); }}
        >
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  Rate Your Experience
                  {selectedProduct?.fromPrompt && pendingReviews.length > 1 && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full align-middle">
                      {pendingReviews.length} to review
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3 mt-3">
                  {selectedProduct?.selectedImage && (
                    <img
                      src={selectedProduct.selectedImage}
                      alt={selectedProduct.productName}
                      className="w-16 h-16 object-cover rounded-xl ring-2 ring-slate-100 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 line-clamp-2">{selectedProduct?.productName}</p>
                    {selectedProduct?.order && (
                      <>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">#{selectedProduct.order.referenceCode}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Ordered {new Date(selectedProduct.order.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {getStatusDate(selectedProduct.order.statusHistory, "Delivered") && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Delivered {getStatusDate(selectedProduct.order.statusHistory, "Delivered")}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={closeReview} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Your Rating</label>
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map(num => (
                    <button key={num} type="button"
                      onClick={() => setRating(num)}
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star className={`w-10 h-10 ${num <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && <p className="text-center text-xs text-slate-500 mt-2">{["","Terrible","Poor","Okay","Good","Excellent!"][rating]}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Review</label>
                <textarea placeholder="Share your experience…" value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Add Photos <span className="text-xs text-slate-400 font-normal">(up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {reviewImages.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {reviewImages.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 gap-1">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeReview}
                  className="btn-simple flex-1 py-3">
                  Cancel
                </button>
                <button type="button" onClick={handleReviewSubmit} disabled={submitting}
                  className="btn-gradient flex-1 py-3">
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order, getStatusDate, getStatusIndex, onReview, onGenerateInvoice }) => {
  const currentIndex = getStatusIndex(order.statusHistory);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">

      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Order Ref</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{order.referenceCode}</span>
          </div>
          <div className="h-7 w-px bg-slate-200 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Date</span>
            <span className="text-xs text-slate-600">
              {new Date(order.orderDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[order.currentStatus] || "bg-slate-100 text-slate-600"}`}>
            {order.currentStatus}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PAYMENT_STATUS_COLOR[order.paymentStatus] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
            {order.paymentStatus}
          </span>
          <button onClick={() => onGenerateInvoice(order)}
            className="btn-simple px-2.5 py-1 text-xs shadow-none">
            <Receipt className="w-3 h-3" /> Invoice
          </button>
        </div>
      </div>

      {order.cartItems.map((product, idx) => (
        <Section
          key={idx}
          defaultOpen={true}
          title={product.productName}
          icon={<Package className="w-3.5 h-3.5" />}
        >
          <div className="p-4 flex gap-3 bg-white">
            <img
              src={product.selectedImage}
              alt={product.productName}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl ring-2 ring-slate-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 text-xs mb-2">
                {product.combination && Object.entries(product.combination).map(([key, value]) => (
              <p key={key} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-medium" >{key}: {value}</p>
            ))}
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-medium">Units: {product.unitDetails?.length}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">৳{product.selectedPrice}</span>
              </div>
              {product.unitDetails?.some(u => u.description) && (
                <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 border border-slate-100">
                  <span className="font-semibold text-slate-600 mr-1">Note:</span>
                  <span dangerouslySetInnerHTML={{ __html: product.unitDetails.map(u => u.description).join(", ") }} />
                </div>
              )}
              {order.currentStatus === "Delivered" && !order.reviewedProductIds?.includes(product.productId) && (
                <button
                  onClick={() => onReview({ ...product, orderId: order._id, order })}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Star className="w-3 h-3" /> Review
                </button>
              )}
            </div>
          </div>
        </Section>
      ))}

      <Section
        defaultOpen={true}
        title="Tracking"
        icon={<Truck className="w-3.5 h-3.5" />}
        accent="border-indigo-100"
      >
        <div className="px-4 py-4 bg-white">
          <div className="flex items-start justify-between">
            {STATUS_FLOW.map((status, i) => {
              const isCompleted = i <= currentIndex;
              const statusDate  = getStatusDate(order.statusHistory, status.key);
              const Icon        = status.icon;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 px-0.5">
                    <div className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all ${
                      isCompleted ? 'bg-indigo-500 shadow-md shadow-indigo-200' : 'bg-slate-200'
                    }`}>
                      <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${isCompleted ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <p className={`text-[9px] sm:text-xs font-semibold mt-1 text-center leading-tight ${isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {status.label}
                    </p>
                    {statusDate && (
                      <p className="text-[9px] text-slate-400 mt-0.5 text-center">{statusDate}</p>
                    )}
                  </div>
                  {i !== STATUS_FLOW.length - 1 && (
                    <div className={`h-0.5 flex-1 -mx-3 mb-5 ${i < currentIndex ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Order details — collapsed by default ── */}
      <Section
        defaultOpen={false}
        title="Order Details"
        icon={<Receipt className="w-3.5 h-3.5" />}
      >
        <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Buyer</p>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="font-semibold">{order.buyerName}</p>
              <p className="text-slate-500 text-xs">{order.buyerEmail}</p>
              <p className="text-slate-500 text-xs">{order.buyerPhone}</p>
              <p className="text-slate-500 text-xs flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />{order.buyerAddress}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Delivery
            </p>
            <div className="space-y-1 text-xs text-slate-700">
              <p>{order.delivery?.area}</p>
              <p className="text-slate-500">Est. {order.delivery?.period}</p>
              <p className="text-slate-500">Charge: <span className="font-semibold text-slate-700">৳{order.delivery?.charge}</span></p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Payment
            </p>
            <div className="space-y-1 text-xs text-slate-700">
              <p>Method: <span className="font-semibold">{order.paymentMethod}</span></p>
              <p className="text-slate-500">Number: {order.paymentNumber}</p>
              <p className="text-slate-500 font-mono">{order.transactionId}</p>
              <p className={`font-semibold ${order.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>
                {order.paymentStatus}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Receipt className="w-3 h-3" /> Summary
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>৳{order.subtotal}</span></div>
              <div className="flex justify-between text-slate-600"><span>Delivery</span><span>৳{order.deliveryCharge}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Discount</span>
                  <span>-৳{order.discount}</span>
                </div>
              )}
              {order.coupon && <p className="text-blue-600">Coupon: {order.coupon}</p>}
              <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-800">
                <span>Total</span><span>৳{order.totalPrice}</span>
              </div>
            </div>
          </div>

        </div>
      </Section>

    </div>
  );
};

export default Profile;