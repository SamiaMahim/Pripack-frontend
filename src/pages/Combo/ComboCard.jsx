/* eslint-disable react/prop-types */
import { NavLink } from "react-router-dom";
import { base_url } from "../../config/config";
import { getSlugPath } from "../../Utils/slug";
import { useLanguage, pickField } from "../../context/LanguageContext";

export const savingsPercent = (combo) =>
  combo.individualTotal > combo.comboPrice
    ? Math.round(((combo.individualTotal - combo.comboPrice) / combo.individualTotal) * 100)
    : 0;

const ComboCard = ({ combo }) => {
  const { language } = useLanguage();
  const bn = language === "bn";
  const pct = savingsPercent(combo);

  return (
    <NavLink
      to={`/combo/${getSlugPath(combo)}`}
      className="relative block shrink-0 cursor-pointer bg-white rounded-xl border border-gray-100 hover:scale-105 duration-500 w-[44vw] sm:w-[200px] lg:w-[260px] m-1"
    >
      {pct > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-teal-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow">
          {bn ? `${pct}% সাশ্রয়` : `Save ${pct}%`}
        </span>
      )}

      <img
        src={`${base_url}${combo.image}`}
        alt={combo.title}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="w-full object-cover h-[145px] sm:h-[200px] lg:h-[250px] rounded-t-xl"
      />

      <div className="p-1.5 sm:p-2">
        <p className="font-bold leading-tight truncate mt-1.5 text-[11px] sm:text-sm">
          {pickField(combo, "title", language)}
        </p>
        <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5">
          {bn ? `${combo.itemCount}টি পণ্য` : `${combo.itemCount} items`}
          {combo.remaining <= 10 && (
            <span className="text-orange-500"> · {bn ? `মাত্র ${combo.remaining}টি বাকি` : `Only ${combo.remaining} left`}</span>
          )}
        </p>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <p className="font-semibold text-indigo-600 text-[11px] sm:text-sm">{combo.comboPrice} ৳</p>
          {combo.individualTotal > combo.comboPrice && (
            <p className="text-[9px] sm:text-xs text-gray-400 line-through">{combo.individualTotal} ৳</p>
          )}
        </div>
      </div>
    </NavLink>
  );
};

export default ComboCard;
