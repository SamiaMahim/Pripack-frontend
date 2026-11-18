import { useState, useEffect, useContext, useRef } from 'react';
import '../../styles/checkout.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/Authprovider';
import { base_url } from '../../config/config';
import RichTextEditor from '../../Utils/RIchTextEditor';
import { useLanguage, pickField } from '../../context/LanguageContext';
import { clearCart, setCartUnits, removeCartItem } from '../../Utils/cartApi';
import Swal from 'sweetalert2';
import { Paperclip, Upload, X, Minus, Plus, Trash2 } from 'lucide-react';

const getImageUrl = (product) => {
  if (product.selectedImage) return product.selectedImage;
  const pic = product.mainPics?.[0];
  return pic ? `${base_url}${pic}` : '';
};

// One id per checkout attempt; the backend returns the existing order if it sees it twice.
const newCheckoutId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const Checkout = () => {
  const navigate = useNavigate();
  const checkoutIdRef = useRef(newCheckoutId());
  // Ref blocks a second click synchronously; state drives the disabled buttons.
  const placingRef = useRef(false);
  const [placing, setPlacing] = useState(false);
  // Field errors show only after the first order attempt, then update live as the buyer types.
  const [attempted, setAttempted] = useState(false);
  const { user, login } = useContext(AuthContext);
  const { language } = useLanguage();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [unitDetails, setUnitDetails] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const deliveryCharge = selectedDelivery ? parseFloat(selectedDelivery.charge) || 0 : 0;

  const discountAmount = (() => {
    if (!appliedCoupon) return 0;
    const base = subtotal + deliveryCharge;
    if (appliedCoupon.discounttype === "fixed") {
      return Math.min(parseFloat(appliedCoupon.discount) || 0, parseFloat(appliedCoupon.maxamount) || Infinity);
    }
    const pct = (base * (parseFloat(appliedCoupon.discount) || 0)) / 100;
    return appliedCoupon.maxamount ? Math.min(pct, parseFloat(appliedCoupon.maxamount)) : pct;
  })();

  const totalPrice = Math.max(0, subtotal + deliveryCharge - discountAmount);

  // "Buy Now" checks out a single item kept in localStorage, not the cart.
  const isBuyNowRef = useRef(false);

  const applyItems = (items) => {
    setCartItems(items);
    setSubtotal(items.reduce((acc, item) => acc + (parseFloat(item.selectedPrice) || 0) * (parseInt(item.units) || 1), 0));
  };

  useEffect(() => {
    const buyNowItem = JSON.parse(localStorage.getItem("buyNowItem"));
    const cartItems  = JSON.parse(localStorage.getItem("cart")) || [];
    const storedCart = buyNowItem ? [buyNowItem] : cartItems;
    isBuyNowRef.current = !!buyNowItem;

    applyItems(storedCart);
    setUnitDetails(storedCart.map(item =>
      Array.from({ length: parseInt(item.units) || 1 }, () => ({ description: "", file: null }))
    ));
    if (user) {
      setBuyerName(user.name || "");
      setBuyerEmail(user.email || "");
      setBuyerPhone(user.phone || "");
      setBuyerAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    fetch(`${base_url}/delivery`)
      .then(r => r.json())
      .then(data => setDeliveryOptions(data))
      .catch(err => console.error("Error fetching delivery:", err));

    fetch(`${base_url}/couponshow`)
      .then(r => r.json())
      .then(data => setCoupons(data))
      .catch(err => console.error("Error fetching coupons:", err));
  }, []);

  const handleApplyCoupon = () => {
    setCouponError("");
    setCouponSuccess("");
    setAppliedCoupon(null);

    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = coupons.find(c => c.couponcode?.toUpperCase() === code);
    if (!found) { setCouponError("Invalid coupon code."); return; }

    if (found.coupondate && new Date(found.coupondate) < new Date()) {
      setCouponError("This coupon has expired."); return;
    }
    if (found.remaining !== undefined && found.remaining <= 0) {
      setCouponError("This coupon is fully redeemed."); return;
    }
    if (found.minspent && subtotal < parseFloat(found.minspent)) {
      setCouponError(`Minimum order ৳${found.minspent} required.`); return;
    }
    setAppliedCoupon(found);
    setCouponSuccess(`"${found.couponname}" applied!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  // Persist a change: the server cart for cart checkouts, localStorage for Buy Now.
  const saveItem = (item, units) => {
    if (isBuyNowRef.current) {
      if (units) localStorage.setItem("buyNowItem", JSON.stringify({ ...item, units }));
      else localStorage.removeItem("buyNowItem");
      return;
    }
    if (!item.lineId) return;
    (units ? setCartUnits(item.lineId, units) : removeCartItem(item.lineId))
      .catch((err) => {
        console.error(err);
        Swal.fire({ icon: "error", title: "Cart not updated", text: err.message, confirmButtonColor: "#14b8a6" });
      });
  };

  const updateUnits = (pi, delta) => {
    const item = cartItems[pi];
    if (!item || placing) return;
    const current = parseInt(item.units) || 1;
    const next = Math.max(1, current + delta);
    const units = item.maxUnits ? Math.min(item.maxUnits, next) : next;
    if (units === current) return;

    applyItems(cartItems.map((it, i) => (i === pi ? { ...it, units } : it)));
    // Grow or trim this product's unit forms, keeping what was already typed.
    setUnitDetails(prev => prev.map((list, i) => {
      if (i !== pi) return list;
      if (units < list.length) return list.slice(0, units);
      return [...list, ...Array.from({ length: units - list.length }, () => ({ description: "", file: null }))];
    }));
    saveItem(item, units);
  };

  const removeItem = async (pi) => {
    const item = cartItems[pi];
    if (!item || placing) return;
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Remove item?",
      text: `Remove "${item.productName}" from this order?`,
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed) return;

    applyItems(cartItems.filter((_, i) => i !== pi));
    setUnitDetails(prev => prev.filter((_, i) => i !== pi));
    saveItem(item, 0);
  };

  // Lowering the subtotal can drop it under an applied coupon's minimum spend.
  useEffect(() => {
    if (appliedCoupon?.minspent && subtotal < parseFloat(appliedCoupon.minspent)) {
      setAppliedCoupon(null);
      setCouponSuccess("");
      setCouponError(`Coupon removed: minimum order ৳${appliedCoupon.minspent} required.`);
    }
  }, [subtotal, appliedCoupon]);

  const handleUnitDescription = (pi, ui, value) => {
    setUnitDetails(prev => {
      const updated = prev.map(p => [...p]);
      updated[pi][ui] = { ...updated[pi][ui], description: value };
      return updated;
    });
  };

  const handleUnitFile = (pi, ui, file) => {
    setUnitDetails(prev => {
      const updated = prev.map(p => [...p]);
      updated[pi][ui] = { ...updated[pi][ui], file };
      return updated;
    });
  };

  const getErrors = () => {
    const errors = {};
    if (!buyerName.trim()) errors.buyerName = "Name is required";
    if (!buyerPhone.trim()) errors.buyerPhone = "Phone number is required";
    if (!buyerAddress.trim()) errors.buyerAddress = "Address is required";
    if (!user && password !== rePassword) errors.rePassword = "Passwords do not match";
    if (!selectedDelivery) errors.delivery = "Please select a delivery option";
    cartItems.forEach((_, pi) => {
      (unitDetails[pi] || []).forEach((unit, ui) => {
        if (!unit.description.trim()) errors[`unit_${pi}_${ui}`] = "Description is required";
      });
    });
    return errors;
  };
  const errors = attempted ? getErrors() : {};

  // Marks the form as attempted and scrolls to the first invalid field.
  const validateForm = () => {
    if (cartItems.length === 0) {
      Swal.fire({ icon: "info", title: "Your cart is empty", text: "Add a product before placing an order.", confirmButtonColor: "#14b8a6" });
      return false;
    }
    setAttempted(true);
    if (Object.keys(getErrors()).length === 0) return true;
    setTimeout(() => {
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    return false;
  };

  const showError = (text) => Swal.fire({ icon: "error", title: "Order not placed", text, confirmButtonColor: "#14b8a6" });

  const handlePayOnDelivery = async () => {
    if (placingRef.current) return;
    if (!validateForm()) return;

    const enrichedCartItems = cartItems.map((item, pi) => ({
      ...item,
      unitDetails: (unitDetails[pi] || []).map(u => ({
        description: u.description,
        fileName: u.file ? u.file.name : null,
      })),
    }));

    const formData = new FormData();
    formData.append("buyerName", buyerName);
    formData.append("buyerEmail", buyerEmail);
    formData.append("buyerPhone", buyerPhone);
    formData.append("buyerAddress", buyerAddress);
    formData.append("totalPrice", String(totalPrice));
    formData.append("subtotal", String(subtotal));
    formData.append("deliveryCharge", String(deliveryCharge));
    formData.append("deliveryArea", selectedDelivery?.area || "");
    formData.append("deliveryPeriod", selectedDelivery?.period || "");
    formData.append("coupon", appliedCoupon?.couponcode || "");
    formData.append("discount", String(discountAmount));
    formData.append("loggedIn", String(!!user));
    if (user) formData.append("customerId", user.userId);
    if (!user) formData.append("password", password);
    formData.append("cartItems", JSON.stringify(enrichedCartItems));
    formData.append("checkoutId", checkoutIdRef.current);

    unitDetails.forEach((productUnits, pi) => {
      productUnits.forEach((unit, ui) => {
        if (unit.file) formData.append(`unit_file_${pi}_${ui}`, unit.file, unit.file.name);
      });
    });

    placingRef.current = true;
    setPlacing(true);
    let placed = false;
    try {
      const res = await fetch(`${base_url}/placeorder`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.exists) {
        Swal.fire({ icon: "info", title: "Account exists", text: "This phone number already has an account. Please login first!", confirmButtonColor: "#14b8a6" });
        return;
      }
      if (data.success) {
        // Clear first: a new customer's login merges this browser's cart into their account.
        clearCart();
        if (data.token) login(data.token);
        placed = true;
        setShowConfirmation(true);
      }
      else showError(data.message || "Failed to place order!");
    } catch (error) {
      console.error(error);
      showError("Server error! Please try again.");
    } finally {
      // Stay locked after success so the same cart can't be ordered again.
      if (!placed) { placingRef.current = false; setPlacing(false); }
    }
  };
const handlePayNow = async () => {
  if (placingRef.current) return;
  if (!validateForm()) return;

  const enrichedCartItems = cartItems.map((item, pi) => ({
    ...item,
    unitDetails: (unitDetails[pi] || []).map(u => ({
      description: u.description,
      fileName: u.file ? u.file.name : null,
    })),
  }));

  
  const formData = new FormData();
  formData.append("buyerName", buyerName);
  formData.append("buyerEmail", buyerEmail);
  formData.append("buyerPhone", buyerPhone);
  formData.append("buyerAddress", buyerAddress);
  formData.append("totalPrice", String(totalPrice));
  formData.append("subtotal", String(subtotal));
  formData.append("deliveryCharge", String(deliveryCharge));
  formData.append("deliveryArea", selectedDelivery?.area || "");
  formData.append("deliveryPeriod", selectedDelivery?.period || "");
  formData.append("coupon", appliedCoupon?.couponcode || "");
  formData.append("discount", String(discountAmount));
  formData.append("loggedIn", String(!!user));
  if (user) formData.append("customerId", user.userId);
  formData.append("paymentMethod", "Online Payment"); // ← Pay Now specific
  if (!user) formData.append("password", password);
  formData.append("cartItems", JSON.stringify(enrichedCartItems));
  formData.append("checkoutId", checkoutIdRef.current);

  unitDetails.forEach((productUnits, pi) => {
    productUnits.forEach((unit, ui) => {
      if (unit.file) formData.append(`unit_file_${pi}_${ui}`, unit.file, unit.file.name);
    });
  });

  placingRef.current = true;
  setPlacing(true);
  let placed = false;
  try {
    const res = await fetch(`${base_url}/placeorder`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.exists) {
        Swal.fire({ icon: "info", title: "Account exists", text: "This phone number already has an account. Please login first!", confirmButtonColor: "#14b8a6" });
        return;
      }
    if (data.success) {
      // Clear first: a new customer's login merges this browser's cart into their account.
      clearCart();
      if (data.token) login(data.token);
      placed = true;
      navigate("/paymentgateway", {
        state: {
          orderId: String(data.orderId),
          orderSummary: { subtotal, deliveryCharge, discount: discountAmount, totalPrice },
        },
      });
    } else {
      showError(data.message || "Failed to place order!");
    }
  } catch (error) {
    console.error(error);
    showError("Server error! Please try again.");
  } finally {
    if (!placed) { placingRef.current = false; setPlacing(false); }
  }
};


  const closeConfirmationPopup = () => { setShowConfirmation(false); navigate("/profile"); };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center py-10 mt-10 px-4">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-5 pb-2 border-b">Buyer Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1 text-sm font-medium"><span>Name <span className="text-red-500">*</span></span>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Type here" data-invalid={!!errors.buyerName} className={`input input-bordered w-full h-10 rounded-md ${errors.buyerName ? "input-error" : ""}`} />
              {errors.buyerName && <span className="text-xs text-red-500 font-normal">{errors.buyerName}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Email
              <input type="text" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="Type here" className="input input-bordered w-full h-10 rounded-md" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <label className="flex flex-col gap-1 text-sm font-medium"><span>Phone Number <span className="text-red-500">*</span></span>
              <input type="text" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="Type here" data-invalid={!!errors.buyerPhone} className={`input input-bordered w-full h-10 rounded-md ${errors.buyerPhone ? "input-error" : ""}`} />
              {errors.buyerPhone && <span className="text-xs text-red-500 font-normal">{errors.buyerPhone}</span>}
            </label>
            {!user && (
              <>
                <label className="flex flex-col gap-1 text-sm font-medium">Password
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input input-bordered w-full h-10 rounded-md" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">Retype Password
                  <input type="password" value={rePassword} onChange={e => setRePassword(e.target.value)} data-invalid={!!errors.rePassword} className={`input input-bordered w-full h-10 rounded-md ${errors.rePassword ? "input-error" : ""}`} />
              {errors.rePassword && <span className="text-xs text-red-500 font-normal">{errors.rePassword}</span>}
                </label>
              </>
            )}
          </div>

          <div className="mt-5">
            <label className="flex flex-col gap-1 text-sm font-medium"><span>Address <span className="text-red-500">*</span></span>
              <textarea data-invalid={!!errors.buyerAddress} className={`textarea textarea-bordered h-28 rounded-md resize-none ${errors.buyerAddress ? "textarea-error" : ""}`} value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder="Enter your full address" />
              {errors.buyerAddress && <span className="text-xs text-red-500 font-normal">{errors.buyerAddress}</span>}
            </label>
          </div>

          {cartItems.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">Unit Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Tell us what to print on each unit. Attach a design file if you have one.</p>
              </div>
              <div className="flex flex-col gap-6">
                {cartItems.map((product, pi) => {
                  const unitCount = parseInt(product.units) || 1;
                  return (
                    <div key={pi} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Product */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <img src={getImageUrl(product)} alt={product.productName} className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{product.productName}</p>
                          {product.combination && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(product.combination).map(([key, value]) => (
                                <span key={key} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{key}: {value}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full flex-shrink-0">
                          {unitCount} unit{unitCount > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Units */}
                      <div className="divide-y divide-gray-100">
                        {Array.from({ length: unitCount }).map((_, ui) => {
                          const errorKey = `unit_${pi}_${ui}`;
                          const file = unitDetails[pi]?.[ui]?.file;
                          return (
                            <div key={ui} className="p-4 flex flex-col gap-4">
                              {unitCount > 1 && (
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">{ui + 1}</span>
                                  <p className="text-sm font-semibold text-gray-700">Unit {ui + 1} of {unitCount}</p>
                                </div>
                              )}

                              <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium text-gray-800">Description <span className="text-red-500">*</span></p>
                                <div
                                  data-invalid={!!errors[errorKey]}
                                  className={errors[errorKey] ? "rounded-md ring-2 ring-red-400" : ""}
                                >
                                  <RichTextEditor
                                    value={unitDetails[pi]?.[ui]?.description || ""}
                                    placeholder={`Describe unit ${ui + 1}…`}
                                    onChange={(content) => handleUnitDescription(pi, ui, content)}
                                  />
                                </div>
                                {errors[errorKey] && <span className="text-xs text-red-500">{errors[errorKey]}</span>}
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium text-gray-800">Attachment <span className="text-gray-400 font-normal text-xs">(optional)</span></p>
                                {file ? (
                                  <div className="flex items-center gap-3 border border-teal-200 bg-teal-50/50 rounded-lg px-3 py-2">
                                    <Paperclip className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                    <span className="text-xs text-gray-400 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUnitFile(pi, ui, null)}
                                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                                      title="Remove file"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/40 rounded-lg px-3 py-3 cursor-pointer transition">
                                    <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                      <Upload className="w-4 h-4" />
                                    </span>
                                    <span className="flex flex-col">
                                      <span className="text-sm font-semibold text-teal-600">Choose a file</span>
                                      <span className="text-xs text-gray-400">Design, logo or reference image</span>
                                    </span>
                                    <input
                                      type="file"
                                      accept="*/*"
                                      className="hidden"
                                      onChange={e => { handleUnitFile(pi, ui, e.target.files[0] || null); e.target.value = ""; }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">

          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Order Summary</h2>
            <div className="flex flex-col gap-3">
              {cartItems.length === 0 ? (
                <div className="bg-gray-50 text-center py-8 rounded-md text-gray-500 flex flex-col items-center gap-3">
                  <span>No items in cart.</span>
                  <NavLink to="/" className="btn-simple px-4 py-2">Continue Shopping</NavLink>
                </div>
              ) : (
                cartItems.map((product, index) => {
                  const units = parseInt(product.units) || 1;
                  const atMax = product.maxUnits && units >= product.maxUnits;
                  return (
                    <div key={product.lineId || index} className="flex gap-3 border p-3 rounded-lg">
                      <img src={getImageUrl(product)} alt={product.productName} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.productName}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={placing}
                            className="p-1 -mt-1 -mr-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0 disabled:opacity-40"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.combination && Object.entries(product.combination).map(([key, value]) => (
                            <span key={key} className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                              {key}: <span className="font-semibold text-gray-800">{value}</span>
                            </span>
                          ))}
                          {product.selectedQty && (
                            <span className="text-[11px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full">
                              Qty: <span className="font-semibold">{product.selectedQty}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateUnits(index, -1)}
                              disabled={placing || units <= 1}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-teal-600"
                              title="Fewer units"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{units}</span>
                            <button
                              type="button"
                              onClick={() => updateUnits(index, +1)}
                              disabled={placing || atMax}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-teal-600"
                              title="More units"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-gray-400">unit{units > 1 ? "s" : ""}</span>
                          </div>
                          <p className="font-semibold text-green-600 text-sm flex-shrink-0">
                            ৳{(parseFloat(product.selectedPrice) * units).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-base font-semibold mb-3 pb-2 border-b">Delivery Option</h2>
            {errors.delivery && <p data-invalid="true" className="text-xs text-red-500 mb-2">{errors.delivery}</p>}
            {deliveryOptions.length === 0 ? (
              <p className="text-sm text-gray-400">No delivery options available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {deliveryOptions.map((opt) => {
                  const isSelected = selectedDelivery?._id === opt._id;
                  return (
                    <button
                      key={opt._id}
                      onClick={() => setSelectedDelivery(opt)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                        isSelected
                          ? "border-teal-400 bg-teal-50"
                          : "border-gray-200 hover:border-teal-200 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-teal-700" : "text-gray-700"}`}>
                            {pickField(opt, 'area', language)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {pickField(opt, 'period', language)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isSelected ? "text-teal-600" : "text-gray-700"}`}>
                            ৳{opt.charge}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-teal-400 flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-base font-semibold mb-3 pb-2 border-b">Coupon Code</h2>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-300 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-teal-700">{appliedCoupon.couponcode}</p>
                  <p className="text-xs text-teal-500 mt-0.5">
                    {appliedCoupon.discounttype === "fixed"
                      ? `৳${appliedCoupon.discount} off`
                      : `${appliedCoupon.discount}% off`}
                    {appliedCoupon.maxamount ? ` (max ৳${appliedCoupon.maxamount})` : ""}
                  </p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:text-red-600 font-medium">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(""); setCouponSuccess(""); }}
                  placeholder="Enter coupon code"
                  className="input input-bordered flex-1 h-10 rounded-lg text-sm uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-teal-500 text-white px-4 rounded-lg text-sm font-semibold hover:bg-teal-600 transition"
                >
                  Apply
                </button>
              </div>
            )}

            {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-teal-600 mt-2">✓ {couponSuccess}</p>}
          </div>

          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{selectedDelivery ? `৳${deliveryCharge.toFixed(2)}` : <span className="text-gray-400 italic">Select option</span>}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-teal-600">
                  <span>Discount</span>
                  <span>− ৳{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2 mt-1">
                <span>Total</span>
                <span className="text-green-600">৳{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handlePayOnDelivery} disabled={placing || cartItems.length === 0} className="btn-simple w-full mt-5">
              {placing ? "Placing order…" : "Cash on Delivery"}
            </button>
            <button onClick={handlePayNow} disabled={placing || cartItems.length === 0} className="btn-gradient w-full mt-2">
              {placing ? "Placing order…" : "Pay Now"}
            </button>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-3 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Confirmation</h3>
              <button onClick={closeConfirmationPopup}>✖</button>
            </div>
            <p className="mb-5">Thank you! You will receive an order confirmation call soon.</p>
            <div className="flex justify-end">
              <NavLink to="/profile" className="bg-cyan-500 text-white py-2 px-4 rounded-md hover:bg-cyan-600">
                My Profile
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;