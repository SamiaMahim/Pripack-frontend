# PriPackLab — Web Frontend

React storefront for [PriPackLab](https://www.pripacklab.com), an online printing and packaging marketplace in Bangladesh (business cards, ID cards, packaging and more). Customers order products, sellers sell through the platform, suppliers take production jobs, and riders update delivery status.

## Features

### Customers
- **Catalog**: home page with banners and ads, categories, subcategories, related products, featured products, and product details.
- **Combos**: bundled product deals that go into the cart as a single line item.
- **Search**: live product search. Requests are debounced, and stale ones are cancelled.
- **Cart**: stored on the server for signed-in users and for guests (guest ID kept in the browser), with a synced local copy for fast UI updates.
- **Checkout and payment**: order placement with Cash on Delivery or the online payment gateway.
- **Invoices**: downloadable PDF invoices built with jsPDF and jspdf-autotable.
- **Account**: sign up, login, forgot password, profile page, and order history.
- **Ratings and reviews**: product ratings, reviews and comments.
- **Support chat**: live chat with support, file attachments, read receipts (✓ / ✓✓), and smart auto-scroll.
- **Notifications**: in-app bell and `/notifications` page, plus optional web push through Firebase Cloud Messaging (also works in the background through a service worker).
- **Bilingual UI**: English / Bangla toggle, saved per browser.

### Partners
- **Seller dashboard** (`/sellerprofile`): dashboard, place orders, manage orders, and a customer chat inbox.
- **Supplier dashboard** (`/supplierprofile`): view and handle production jobs.
- **Partner registration**: `/sellerregister` and `/supplierregister`.
- **Partner–admin chat**: messaging between partners and admins.
- **Rider order status** (`/rider/order/:id`): delivery status page for riders.

### Platform
- **SEO**: per-page titles and meta tags via `react-helmet-async`, `robots.txt`, and a sitemap generated at build time.
- **Performance**: in-memory GET cache for public endpoints (shared in-flight requests, 2-minute TTL), server-generated image thumbnails (96/160/320/640 px), shimmer loading states, and Firebase loaded on demand.
- **Legal pages**: Privacy Policy and Terms & Conditions.

## Tech Stack

| Area | Tools |
|------|-------|
| Framework | React 18, Vite 5 |
| Routing | React Router 6 (data router, `ScrollRestoration`) |
| Styling | Tailwind CSS 3, daisyUI 4, animate.css, custom CSS in `src/styles/` |
| UI libraries | Swiper, react-responsive-carousel, react-icons, lucide-react, SweetAlert2 |
| Rich text | Quill / react-quill (with image resize) |
| PDF | jsPDF, jspdf-autotable |
| Auth | JWT (decoded with `jwt-decode`), token stored in `localStorage` |
| Push | Firebase Cloud Messaging (web push) |
| SEO | react-helmet-async, custom sitemap script |
| Linting | ESLint 9 (flat config) with React, hooks and refresh plugins |

## Project Structure

```
public/
  assets/                    static images
  firebase-messaging-sw.js   FCM background push service worker
  robots.txt, .htaccess      SEO and SPA rewrite rules
scripts/
  generate-sitemap.js        writes dist/sitemap.xml after build
src/
  main.jsx                   app entry: Helmet, Language, Auth, Notification providers
  routes/Routes.jsx          all routes (public + private)
  Layout/                    main layout (header, footer, outlet)
  config/config.jsx          API URLs read from env
  context/                   Language and Notification contexts
  Utils/                     API helpers (cart, partner, notifications), cache,
                             Firebase/push, search hook, SEO, price, slug, thumbnails
  pages/                     feature pages (Products, Cart, Checkout, Combo, Profile,
                             SellerProfile, SupplierProfile, Rider, supportchat, ...)
  styles/                    page-specific CSS
```

## Getting Started

### Requirements
- Node.js 18+ (the sitemap script uses native `fetch` and `AbortSignal.timeout`)
- npm

### Install and run

```bash
npm install
npm run dev        # dev server (uses .env.development)
npm run build      # production build + sitemap (uses .env.production)
npm run preview    # preview the production build
npm run lint       # ESLint
npm run sitemap    # regenerate dist/sitemap.xml only
```

### Environment variables

Create `.env.development` and `.env.production` in the project root. Both files are git-ignored.

```env
# Backend
VITE_BASE_URL=          # main REST API base URL
VITE_LOCATION_URL=      # base URL for uploaded files / images
VITE_CHAT_URL=          # chat service URL

# Firebase web push (optional; push is turned off if these are missing)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

> `public/firebase-messaging-sw.js` cannot read Vite env vars, so it repeats the Firebase web config. Keep it in sync with `VITE_FIREBASE_*`, and keep its `FIREBASE_VERSION` equal to the installed `firebase` package version.

## Deployment

1. Run `npm run build`. This outputs to `dist/` and writes `dist/sitemap.xml` from the live API (categories, subcategories, combos, products). If the API is unreachable, the sitemap still lists the static pages.
2. Serve `dist/` as a single-page app. On Apache, `public/.htaccess` sends all routes to `index.html` and sets cache headers: hashed bundles are cached for 1 year, other static files for 7 days, and `index.html` plus the push service worker are always revalidated. Other servers need the same fallback to `index.html`.
