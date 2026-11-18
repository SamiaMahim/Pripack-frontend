import { base_url } from "../config/config";

// Calls to the backend's /notifications endpoints with the customer's (or
// seller's) token. Errors carry `status` so callers can tell a 401 (token
// expired or missing) apart from a network failure (no status).

// Login stores the same token as both "customerToken" and "authToken";
// checkout sign-ups only set "authToken" (via AuthContext.login), so the
// AuthContext token wins and "customerToken" is the fallback.
export function customerToken() {
  try {
    return localStorage.getItem("authToken") || localStorage.getItem("customerToken") || "";
  } catch {
    return "";
  }
}

export async function notificationsRequest(path, method = "GET", body, token = customerToken()) {
  if (!token) {
    const err = new Error("Please log in to see your notifications.");
    err.status = 401;
    throw err;
  }
  let res;
  try {
    res = await fetch(`${base_url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.success === false) {
    const err = new Error(
      res.status === 401
        ? "Your session has expired. Please log in again."
        : (data && typeof data.message === "string" && data.message) || "Request failed"
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

// Only same-site paths are followed (data.url comes from the backend).
export function notificationPath(n) {
  const url = n?.data?.url;
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : null;
}

// "5m ago", "3h ago", "2d ago", then a date.
export function timeAgo(value) {
  const time = new Date(value).getTime();
  if (!time) return "";
  const s = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(time).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
