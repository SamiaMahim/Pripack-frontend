/* global firebase, importScripts */
// Firebase Cloud Messaging service worker (background web push).
//
// Registered by src/Utils/firebase.js with its own scope. A service worker
// can't read Vite env vars, so the public web config is repeated here: keep
// it in sync with VITE_FIREBASE_* in .env.development / .env.production.
// Keep FIREBASE_VERSION on the same version as the `firebase` npm package.
const FIREBASE_VERSION = "13.0.0";

const config = {
  apiKey: "AIzaSyAmZRGaPr6IzuwS6XSAlFlFh3DaBMqVT84",
  authDomain: "pripacklab.firebaseapp.com",
  projectId: "pripacklab",
  storageBucket: "pripacklab.firebasestorage.app",
  messagingSenderId: "928738802667",
  appId: "1:928738802667:web:43e95cf5346a4962e1b7ae",
};

// Clicks: open data.url (a site path such as /profile).
// Registered before the Firebase scripts so it runs instead of Firebase's own
// handler, which only focuses an open tab without navigating it.
self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const fcm = data.FCM_MSG || {};
  const target = (fcm.data && fcm.data.url) || data.url || (fcm.fcmOptions && fcm.fcmOptions.link) || "/";
  let url;
  try {
    url = new URL(target, self.location.origin);
  } catch {
    url = new URL("/", self.location.origin);
  }
  if (url.origin !== self.location.origin) url = new URL("/", self.location.origin);

  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const tab = windows.find((c) => new URL(c.url).origin === self.location.origin);
    if (tab) {
      // The app navigates itself (src/pages/Notifications/NotificationToast.jsx).
      await tab.focus();
      tab.postMessage({ type: "pripack:navigate", url: url.pathname + url.search + url.hash });
      return;
    }
    await self.clients.openWindow(url.href);
  })());
});

importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`
);
firebase.initializeApp(config);
const messaging = firebase.messaging();

// Messages with a `notification` payload are shown by FCM itself; only
// data-only messages need showing here.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const data = payload.data || {};
  if (!data.title) return;
  self.registration.showNotification(data.title, {
    body: data.message || data.body || "",
    icon: "/assets/ion.png",
    data: { url: data.url || "/" },
  });
});
