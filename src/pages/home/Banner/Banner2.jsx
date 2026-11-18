import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base_url } from "../../../config/config";

const Banner2 = ({ banner = [] }) => {
  const [current, setCurrent] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0]));
  const navigate = useNavigate();

  const handleBannerClick = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      navigate(link);
    }
  };

  // Sort by bannerorder if present
  const sorted = [...banner].sort((a, b) => a.bannerorder - b.bannerorder);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (sorted.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sorted.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sorted.length]);

  useEffect(() => {
    setSeen((prev) => (prev.has(current) ? prev : new Set(prev).add(current)));
  }, [current]);

  if (!sorted.length) return null;

  // Only the visible slide and the next one are mounted, so the page doesn't
  // download every banner up front. A slide's images stay once shown.
  const next = (current + 1) % sorted.length;

  const active = sorted[current];

  return (
    <div className="mt-24 h-[200px] lg:h-[400px] w-full relative overflow-hidden bg-gray-100">
      {sorted.map((b, i) => (
        <div
          key={b._id}
          onClick={() => handleBannerClick(b.link)}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          } ${b.link ? "cursor-pointer" : ""}`}
        >
          {i === 0 ? (
            // First slide is the LCP image: load it eagerly at high priority.
            // <picture> picks one variant per screen size, so only one file downloads.
            (b.webbanner || b.phonebanner) && (
              <picture>
                {b.webbanner && b.phonebanner && (
                  <source media="(min-width: 1024px)" srcSet={`${base_url}${b.webbanner}`} />
                )}
                <img
                  src={`${base_url}${b.phonebanner || b.webbanner}`}
                  className="block absolute inset-0 w-full h-full object-cover"
                  alt={b.bannername}
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
            )
          ) : (i === current || i === next || seen.has(i)) && (<>
          {/* lazy: the variant hidden at this screen size (display:none) never downloads. */}
          {/* Web banner: hidden on small, shown on lg */}
          {b.webbanner && (
            <img
              src={`${base_url}${b.webbanner}`}
              className="hidden lg:block absolute inset-0 w-full h-full object-cover"
              alt={b.bannername}
              loading="lazy"
            />
          )}

          {/* Phone banner: shown on small, hidden on lg */}
          {b.phonebanner && (
            <img
              src={`${base_url}${b.phonebanner}`}
              className="block lg:hidden absolute inset-0 w-full h-full object-cover"
              alt={b.bannername}
              loading="lazy"
            />
          )}

          {/* Fallback: if only one image exists, show it on all sizes */}
          {b.webbanner && !b.phonebanner && (
            <img
              src={`${base_url}${b.webbanner}`}
              className="block lg:hidden absolute inset-0 w-full h-full object-cover"
              alt={b.bannername}
              loading="lazy"
            />
          )}
          {b.phonebanner && !b.webbanner && (
            <img
              src={`${base_url}${b.phonebanner}`}
              className="hidden lg:block absolute inset-0 w-full h-full object-cover"
              alt={b.bannername}
              loading="lazy"
            />
          )}
          </>)}
        </div>
      ))}

      {/* Dot indicators */}
      {sorted.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {sorted.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Banner2;