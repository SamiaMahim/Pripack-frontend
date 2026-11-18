import { base_url } from "../config/config";
import { customerToken } from "./notificationsApi";

// Calls to the backend with the logged-in seller or supplier token.
// Resolves with the JSON body; rejects with an Error carrying `status` and the
// server's message so callers can show it as-is.
export async function partnerRequest(path, { method = "GET", body } = {}) {
  const token = customerToken();
  if (!token) {
    const err = new Error("Please log in again.");
    err.status = 401;
    throw err;
  }

  const res = await fetch(`${base_url}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const taka = (n) => `৳ ${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

// Badge colors for seller order statuses.
export const STATUS_STYLES = {
  "Pending Verification": "bg-amber-50 text-amber-700",
  "Transferred to Supplier": "bg-indigo-50 text-indigo-700",
  Delivered: "bg-green-50 text-green-700",
  Cancelled: "bg-red-50 text-red-700",
};

// Where the "Profile" link goes for each account type.
export const profilePathFor = (user) => (
  user?.atype === "seller" ? "/sellerprofile" : user?.atype === "supplier" ? "/supplierprofile" : "/profile"
);
