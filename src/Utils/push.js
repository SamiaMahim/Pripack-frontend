import { notificationsRequest } from "./notificationsApi";
import { deletePushToken, getPushToken } from "./firebase";

// Links this browser's push token to the signed-in customer/seller on the
// backend. The token sent last is kept so logout can unregister it, even
// after a reload.
const PUSH_TOKEN_KEY = "pushToken";
const UNREGISTER_TIMEOUT = 3000;

function storedToken() {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(PUSH_TOKEN_KEY, token);
    else localStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // storage blocked: logout just won't know the token after a reload
  }
}

// Sends the current token to the backend when notifications are already
// allowed. Never prompts. Resolves to true when the device is registered.
export async function syncPushToken() {
  const token = await getPushToken();
  if (!token) return false;
  try {
    await notificationsRequest("/notifications/device-token", "POST", { token, platform: "web" });
    storeToken(token);
    return true;
  } catch {
    return false;
  }
}

// Logout: removes the token on the backend (call it while the session token
// is still stored, or pass it), then invalidates it with FCM so pushes stop
// even if the backend call failed (e.g. the session had already expired).
// Best effort and time-boxed, so a slow or offline backend never blocks
// logging out.
export async function unregisterPush(sessionToken) {
  const token = storedToken();
  if (!token) return;
  storeToken(null);
  const timeout = new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT));
  await Promise.race([
    notificationsRequest("/notifications/device-token", "DELETE", { token }, sessionToken).catch(() => {}),
    timeout,
  ]);
  await Promise.race([deletePushToken(), timeout]);
}
