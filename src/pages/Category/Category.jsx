/* eslint-disable react/prop-types */
import { thumb } from '../../Utils/thumb';
import { useState } from "react";
import { Link } from "react-router-dom";
import { location_url } from "../../config/config";
import { getSlugPath } from "../../Utils/slug";
import { useLanguage, pickField } from "../../context/LanguageContext";
import { cachedGet } from "../../Utils/apiCache";

// Home sends only the first few categories; "See all" fetches the full list once.
const Category = ({ categories, totalCount = 0 }) => {
  const { language } = useLanguage();
  const [allCategories, setAllCategories] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  if (!categories?.length) return null;

  const hasMore = totalCount > categories.length;
  const shown = expanded && allCategories ? allCategories : categories;

  const toggleAll = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!allCategories) {
      setLoadingAll(true);
      try {
        setAllCategories(await cachedGet("/getcat"));
      } catch (err) {
        console.error("Error fetching categories:", err);
        return;
      } finally {
        setLoadingAll(false);
      }
    }
    setExpanded(true);
  };

  const seeAllLabel = expanded
    ? (language === "bn" ? "কম দেখুন" : "Show less")
    : loadingAll
      ? (language === "bn" ? "লোড হচ্ছে…" : "Loading…")
      : (language === "bn" ? `সব ক্যাটাগরি (${totalCount})` : `See all categories (${totalCount})`);

  return (
    <section className="w-full mt-10 mb-6">
      {/* Same heading style as the product sections below */}
      <div className="flex flex-row justify-between items-center mx-2 mb-5">
        <h2 className="text-xl font-bold text-teal-500">
          {language === "bn" ? "ক্যাটাগরি" : "Shop by Category"}
        </h2>
        {hasMore && (
          <button
            type="button"
            onClick={toggleAll}
            disabled={loadingAll}
            className="text-sm font-medium cursor-pointer hover:text-indigo-500 disabled:opacity-60"
          >
            {seeAllLabel}
          </button>
        )}
      </div>

      {/* Mobile: horizontal scroll row of round icons */}
      <div className="flex lg:hidden gap-4 overflow-x-auto pb-2 px-2 scrollbar-hide">
        {shown.map((category, index) => (
          <Link
            key={category._id || index}
            to={`/categorydetails/${getSlugPath(category)}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] group"
          >
            <div className="w-[72px] h-[72px] rounded-full p-0.5 bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                <img
                  src={thumb(`${location_url}${category.homepic || category.pagecover}`, 160)}
                  alt={category.catname}
                  loading="lazy"
                  className="w-full h-full object-cover group-active:scale-95 transition-transform"
                />
              </div>
            </div>
            <span className="w-full text-[11px] font-semibold text-gray-700 text-center leading-tight line-clamp-2">
              {pickField(category, 'catname', language)}
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop: fixed-size cards that wrap; name sits on the image */}
      <div className="hidden lg:grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-5 px-2">
        {shown.map((category, index) => (
          <Link
            key={category._id || index}
            to={`/categorydetails/${getSlugPath(category)}`}
            className="group relative block aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={thumb(`${location_url}${category.homepic || category.pagecover}`, 640)}
              alt={category.catname}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="text-white font-semibold text-base leading-tight line-clamp-2 drop-shadow">
                {pickField(category, 'catname', language)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Category;
