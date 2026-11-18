import { base_url } from "../config/config";
import { addToCart } from "./cartApi";

// A combo goes into the existing cart as one line item using the same keys as products,
// so Cart, Checkout and /placeorder work unchanged. The backend re-reads combo details
// and reserves stock by comboId when the order is placed.
export const buildComboCartItem = (combo, title) => {
  const itemCount = (combo.items || []).reduce((n, i) => n + (i.quantity || 1), 0);
  return {
    productId: String(combo._id),
    isCombo: true,
    comboId: String(combo._id),
    productName: title || combo.title,
    selectedImage: combo.image ? `${base_url}${combo.image}` : null,
    mainPics: combo.image ? [combo.image] : [],
    label: "combo",
    combination: { Combo: `${itemCount} items` },
    selectedPrice: combo.comboPrice,
    units: 1,
    selectedQty: 1,
    maxUnits: combo.remaining,
    sellerId: null,
    sellerName: null,
  };
};

// Resolves to "added" or "exists".
export const addComboToCart = (combo, title) => addToCart(buildComboCartItem(combo, title));

export const buyComboNow = (combo, title) => {
  localStorage.setItem("buyNowItem", JSON.stringify(buildComboCartItem(combo, title)));
};
