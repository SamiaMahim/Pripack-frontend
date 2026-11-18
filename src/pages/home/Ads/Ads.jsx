import { useEffect, useState } from "react";
import { base_url } from "../../../config/config";
import { cachedGet } from "../../../Utils/apiCache";

const getAdImageUrl = (imglink) => {
  if (!imglink) return "";
  return imglink.startsWith("http") ? imglink : `${base_url}${imglink}`;
};

const trackClick = async (adid) => {
  try {
    await fetch(`${base_url}/adclicks/${adid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incrementBy: 1 }),
    });
  } catch (e) {
    console.error("Click tracking failed:", e);
  }
};

// Shown only when an admin set it to "active", and only inside its date window.
const isActive = (ad) => {
  if (ad.status !== "active") return false;
  if (!ad.startdate || !ad.tilldate) return false;

  const now = new Date();
  const start = new Date(`${ad.startdate}T00:00:00`);
  const end = new Date(`${ad.tilldate}T23:59:59`);
  return now >= start && now <= end;
};

// Small "Ad" tag, like the one Google puts on its ad units
const AdBadge = () => (
  <span className="absolute top-1 left-1 z-10 bg-white/90 text-gray-500 text-[9px] font-medium leading-none px-1 py-0.5 rounded-sm border border-gray-200">
    Ad
  </span>
);

// ---- Popup Ad ----
const PopupAd = ({ ad, onClose }) => {
  const handleClick = () => {
    trackClick(ad._id);
    window.open(ad.rdlink?.startsWith("http") ? ad.rdlink : `https://${ad.rdlink}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[90%] max-w-sm rounded-lg overflow-hidden shadow-2xl bg-white border border-gray-200">
        <AdBadge />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black"
        >
          ✕
        </button>
        <div className="w-full aspect-square bg-white flex items-center justify-center">
          <img
            src={getAdImageUrl(ad.imglink)}
            alt={ad.bannername || "Ad"}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleClick}
          />
        </div>
      </div>
    </div>
  );
};

// ---- Banner Slideshow (Homepage Banner, Header, Footer) ----
const BannerAds = ({ ads, className = "" }) => {
  const [current, setCurrent] = useState(0);
  const sorted = [...ads].sort((a, b) => (a.bannerorder || 0) - (b.bannerorder || 0));

  useEffect(() => {
    if (sorted.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % sorted.length), 4000);
    return () => clearInterval(timer);
  }, [sorted.length]);

  if (!sorted.length) return null;

  const handleClick = (ad) => {
    trackClick(ad._id);
    window.open(ad.rdlink?.startsWith("http") ? ad.rdlink : `https://${ad.rdlink}`, "_blank");
  };

  return (
    <div className={`relative mx-auto overflow-hidden bg-white border border-gray-200 rounded ${className}`}>
      <AdBadge />
      {sorted.map((ad, i) => (
        <div
          key={ad._id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={getAdImageUrl(ad.imglink)}
            alt={ad.bannername || "Ad"}
            loading="lazy"
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => handleClick(ad)}
          />
        </div>
      ))}
      {sorted.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {sorted.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-gray-500 scale-125" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// The live left (hls) or right (hrs) sidebar ad, if any.
export const findSidebarAd = (ads = [], side) => ads.find((ad) => isActive(ad) && ad.location === side);

// ---- Sidebar Ad (single tall 1:4 image filling its side column) ----
// Capped to the screen height so a short laptop screen still shows all of it.
const SidebarAd = ({ ad }) => {
  const handleClick = () => {
    trackClick(ad._id);
    window.open(ad.rdlink?.startsWith("http") ? ad.rdlink : `https://${ad.rdlink}`, "_blank");
  };
  return (
    <div className="relative w-full aspect-[1/4] max-h-[calc(100vh-7rem)] bg-white border border-gray-200 rounded overflow-hidden">
      <AdBadge />
      <img
        src={getAdImageUrl(ad.imglink)}
        alt="Ad"
        loading="lazy"
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
};

// ---- Profile Ad (square, under the profile card on every profile page) ----
// Loads its own ads; with several live ones, a random one shows per visit.
export const ProfileAd = () => {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    let cancelled = false;
    cachedGet("/liveads?location=Profile")
      .then((ads) => {
        const live = (Array.isArray(ads) ? ads : []).filter(isActive);
        if (!cancelled && live.length) setAd(live[Math.floor(Math.random() * live.length)]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!ad) return null;

  const handleClick = () => {
    trackClick(ad._id);
    window.open(ad.rdlink?.startsWith("http") ? ad.rdlink : `https://${ad.rdlink}`, "_blank");
  };
  return (
    <div className="relative w-full aspect-square mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <AdBadge />
      <img
        src={getAdImageUrl(ad.imglink)}
        alt="Ad"
        loading="lazy"
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
};

// ---- Main Ads Component ----
// location "hls" / "hrs" draws one sidebar ad filling its side column; Home
// only shows those columns on wide screens, beside the product rows.
// location "Between Rows" draws one ad between product rows; `slot` (0, 1, 2…)
// picks which, so each gap shows the next ad and they repeat once all are used.
// Nothing (not even spacing) renders when the slot has no live ad.
const Adds = ({ ads = [], location, slot = 0 }) => {
  const [popupClosed, setPopupClosed] = useState(false);

  if (location === "hls" || location === "hrs") {
    const ad = findSidebarAd(ads, location);
    return ad ? <SidebarAd ad={ad} /> : null;
  }

  const active = ads.filter((ad) => isActive(ad) && ad.location === location);

  if (!active.length) return null;

  if (location === "Popup") {
    if (popupClosed) return null;
    return <PopupAd ad={active[0]} onClose={() => setPopupClosed(true)} />;
  }

  if (location === "Homepage Banner") {
    return (
      <div className="my-8 px-2">
        <BannerAds ads={active} className="h-[200px] lg:h-[400px] w-full" />
      </div>
    );
  }

  if (location === "Between Rows") {
    const ad = active[slot % active.length];
    return (
      <div className="my-6 px-2">
        {/* Full width of the product rows, always 5:1 */}
        <BannerAds key={ad._id} ads={[ad]} className="w-full aspect-[5/1]" />
      </div>
    );
  }

  if (location === "Header" || location === "Footer") {
    return (
      <div className="my-6 px-2">
        <BannerAds ads={active} className="h-[60px] lg:h-[90px] w-full max-w-[728px]" />
      </div>
    );
  }

  return null;
};

export default Adds;
