import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaPlus, FaMinus } from "react-icons/fa";
import { RiCloseLargeFill } from "react-icons/ri";
import { RiShoppingBag3Line } from "react-icons/ri";
import { base_url } from '../../config/config';
import NavLabel from '../Shared/Header/NavLabel';
import { navButtonClass, navIconClass } from '../Shared/Header/navStyles';
import { setCartUnits, removeCartItem } from '../../Utils/cartApi';

const getImageUrl = (product) => {
  if (product.selectedImage) return product.selectedImage;
  const pic = product.mainPics?.[0];
  return pic ? `${base_url}${pic}` : '';
};

const Cart = () => {
  const [cartItems, setCartItems]   = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isOpen, setIsOpen]         = useState(false);
  const [cartCount, setCartCount]   = useState(0);
  const { pathname } = useLocation();
  const cartActive = isOpen || pathname === '/checkout';

  const loadCart = () => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsWithUnits = storedCart.map(item => ({
      ...item,
      units: item.units || 1,
    }));
    setCartItems(itemsWithUnits);
    calculateTotal(itemsWithUnits);
    setCartCount(itemsWithUnits.length);
  };

  useEffect(() => {
    loadCart();
    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("openCart", () => setIsOpen(true));
    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("openCart", () => setIsOpen(true));
    };
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const calculateTotal = (items) => {
    const total = items.reduce((acc, item) => {
      return acc + (parseFloat(item.selectedPrice) || 0) * (parseInt(item.units) || 1);
    }, 0);
    setTotalPrice(total);
  };

  // Update the drawer immediately; the server reply then refreshes it via "cartUpdated".
  const updateUnits = (index, delta) => {
    const item = cartItems[index];
    if (!item) return;
    const next = Math.max(1, (item.units || 1) + delta);
    const units = item.maxUnits ? Math.min(item.maxUnits, next) : next;
    if (units === item.units) return;
    const updatedCart = cartItems.map((it, i) => (i === index ? { ...it, units } : it));
    setCartItems(updatedCart);
    calculateTotal(updatedCart);
    setCartUnits(item.lineId, units).catch((err) => {
      console.error(err);
      loadCart();
    });
  };

  const removeFromCart = (index) => {
    const item = cartItems[index];
    if (!item) return;
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    calculateTotal(updatedCart);
    setCartCount(updatedCart.length);
    removeCartItem(item.lineId).catch((err) => {
      console.error(err);
      loadCart();
    });
  };

  return (
    <>
      {/* ── Desktop trigger button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`${navButtonClass(cartActive)} lg:flex hidden`}
        aria-label="Open cart"
      >
        <RiShoppingBag3Line className={navIconClass(cartActive)} size={24} />
        <NavLabel>Cart</NavLabel>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[200] h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <RiShoppingBag3Line size={20} className="text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900 tracking-wide">
              My Cart
              {cartItems.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-700 transition p-1"
          >
            <RiCloseLargeFill size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <RiShoppingBag3Line size={48} className="opacity-20" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            cartItems.map((product, index) => (
              <div
                key={index}
                className="flex gap-3 bg-gray-50 rounded-xl p-3 relative group"
              >
                <img
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                  src={getImageUrl(product)}
                  alt={product.productName}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.productName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {product.selectedSize && (
                      <span className="text-xs text-gray-500">Size: {product.selectedSize}</span>
                    )}
                    {product.selectedCut && (
                      <span className="text-xs text-gray-500">Cut: {product.selectedCut}</span>
                    )}
                    {product.selectedQty && (
                      <span className="text-xs text-gray-500">Qty: {product.selectedQty}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateUnits(index, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white transition"
                      >
                        <FaMinus size={9} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{product.units || 1}</span>
                      <button
                        onClick={() => updateUnits(index, +1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white transition"
                      >
                        <FaPlus size={9} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      ৳{(parseFloat(product.selectedPrice) * (product.units || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <RiCloseLargeFill size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-gray-900">৳{totalPrice.toFixed(2)}</span>
            </div>
            <NavLink
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="btn-gradient w-full py-3"
            >
              Checkout
            </NavLink>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;