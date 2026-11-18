import { base_url } from "../config/config";

// The cart lives on the server (GET/POST/PATCH/DELETE /cart...). localStorage
// "cart" is kept as a synced copy so existing readers (cart drawer, footer
// badge, checkout) keep working: every server reply is written back to it and
// "cartUpdated" is fired.
//
// Owner: a signed-in customer's token, else a guest id stored in this browser.

const DEVICE_KEY = "pp_device_id";

const deviceId = () => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev_${crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`}`.replace(/[^A-Za-z0-9_-]/g, "");
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
};

const mirror = (items) => {
  localStorage.setItem("cart", JSON.stringify(items || []));
  window.dispatchEvent(new Event("cartUpdated"));
  return items || [];
};

async function request(method, path, body) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${base_url}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Cart request failed");
  return data;
}

// Load the server cart into the local copy. A cart saved only in this browser
// (from before carts were stored on the server) is uploaded once.
export async function syncCart() {
  const local = readLocal();
  const browserOnly = local.filter((item) => !item.lineId);
  if (browserOnly.length) {
    const data = await request("POST", "/cart/import", { items: browserOnly });
    return mirror(data.items);
  }
  const data = await request("GET", "/cart");
  return mirror(data.items);
}

// Returns "added" or "exists".
export async function addToCart(item) {
  const data = await request("POST", "/cart/items", { item });
  mirror(data.items);
  return data.status;
}

export async function setCartUnits(lineId, units) {
  const data = await request("PATCH", `/cart/items/${encodeURIComponent(lineId)}`, { units });
  return mirror(data.items);
}

export async function removeCartItem(lineId) {
  const data = await request("DELETE", `/cart/items/${encodeURIComponent(lineId)}`);
  return mirror(data.items);
}

export async function clearCart() {
  mirror([]);
  try {
    await request("DELETE", "/cart");
  } catch (err) {
    console.error("Could not clear server cart:", err);
  }
}

// After login: fold this browser's guest cart into the customer's cart.
export async function mergeGuestCart() {
  const data = await request("POST", "/cart/merge");
  return mirror(data.items);
}
