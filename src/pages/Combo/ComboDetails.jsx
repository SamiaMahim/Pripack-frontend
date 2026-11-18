import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import { useLanguage, pickField } from "../../context/LanguageContext";
import { addComboToCart, buyComboNow } from "../../Utils/comboCart";
import { savingsPercent } from "./ComboCard";
import Seo, { SITE_URL, toMetaDescription, bdKeywordsFor } from "../../Utils/Seo";
import { getSlugPath } from "../../Utils/slug";

const actionBtn =
  "h-10 w-32 rounded-lg text-sm font-semibold shadow-md border-2 hover:bg-teal-500 hover:text-white border-teal-500 hover:border-teal-600 text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-teal-600 disabled:hover:scale-100";

const formatDate = (ymd) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const ComboDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const bn = language === "bn";

  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${base_url}/combodetails/${id}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Combo not found");
        setCombo(data);
      })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 mt-20 lg:mx-20 p-5">
        <div className="w-full lg:w-1/2 aspect-square bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }
  if (error || !combo) return (
    <>
      <Seo title="Combo not found" noindex />
      <div className="text-center text-red-500 py-20">{error || "Combo not found"}</div>
    </>
  );

  const title = pickField(combo, "title", language);
  const description = pickField(combo, "description", language);
  const pct = savingsPercent(combo);
  const soldOut = combo.remaining <= 0;
  const available = combo.isLive && !soldOut;

  const unavailableText = soldOut
    ? (bn ? "এই কম্বোটি বিক্রি শেষ।" : "This combo is sold out.")
    : (bn ? "এই অফারটি এখন চালু নেই।" : "This offer is not currently active.");

  const handleAddToCart = async () => {
    if (!available) return;
    let status;
    try {
      status = await addComboToCart(combo, title);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Could not add to cart", text: err.message });
      return;
    }
    if (status === "exists") {
      Swal.fire({ icon: "warning", title: "Already in Cart", text: "This combo is already in your cart." });
      return;
    }
    Swal.fire({ icon: "success", title: "Added!", text: "Combo added to cart successfully." });
  };

  const handleBuyNow = () => {
    if (!available) return;
    buyComboNow(combo, title);
    navigate("/checkout");
  };

  const comboPath = `/combo/${getSlugPath(combo)}`;
  const metaLead = `${combo.title} combo offer in Bangladesh — ৳${combo.comboPrice}${pct > 0 ? ` (save ${pct}%)` : ''}. Cash on delivery to all 64 districts.`;
  const metaDescription = `${metaLead} ${toMetaDescription(combo.description, Math.max(40, 200 - metaLead.length))}`.trim();

  return (
    <div className="flex flex-col mb-10 mt-10 lg:mx-20">
      <Seo
        title={`${combo.title} Combo Offer — Price in Bangladesh`}
        description={metaDescription}
        keywords={[
          ...bdKeywordsFor(combo.title, combo.titleBn),
          `${combo.title} combo offer`,
          'printing combo offer Bangladesh',
          'business combo package Dhaka',
          'কম্বো অফার',
          ...(combo.items || []).map((item) => item.productName),
        ]}
        path={comboPath}
        image={combo.image ? `${base_url}${combo.image}` : undefined}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: combo.title,
          description: metaDescription,
          ...(combo.image && { image: `${base_url}${combo.image}` }),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'BDT',
            price: combo.comboPrice,
            availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}${comboPath}`,
          },
        }}
      />
      <div className="flex flex-col lg:flex-row w-full pt-10">
        {/* Image */}
        <div className="p-5 lg:w-1/2 min-w-0">
          <div className="relative aspect-square">
            {pct > 0 && (
              <span className="absolute top-3 left-3 bg-teal-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                {bn ? `${pct}% সাশ্রয়` : `Save ${pct}%`}
              </span>
            )}
            <img className="w-full h-full object-cover rounded-xl" src={`${base_url}${combo.image}`} alt={title} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 lg:w-1/2 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            {bn ? "কম্বো প্যাকেজ" : "Combo Package"}
          </p>
          <h1 className="lg:text-3xl text-xl font-semibold mt-1">{title}</h1>

          <div className="flex flex-row items-baseline gap-2 mt-2">
            <p className="text-base font-semibold text-black">{bn ? "মূল্য:" : "Price:"}</p>
            <p className="text-2xl font-bold text-green-600">{combo.comboPrice} ৳</p>
            {combo.individualTotal > combo.comboPrice && (
              <p className="text-base text-gray-400 line-through">{combo.individualTotal} ৳</p>
            )}
          </div>
          {combo.individualTotal > combo.comboPrice && (
            <p className="mt-1 text-sm text-gray-500">
              {bn ? "আলাদাভাবে কিনলে" : "Bought separately"}: {combo.individualTotal} ৳ ·{" "}
              <span className="text-red-500 font-semibold">
                {bn ? "সাশ্রয়" : "You save"} {Math.round((combo.individualTotal - combo.comboPrice) * 100) / 100} ৳
              </span>
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
            <span>{bn ? "অফার শেষ" : "Offer ends"}: <b>{formatDate(combo.endDate)}</b></span>
            {!soldOut && (
              <span className={combo.remaining <= 10 ? "text-orange-500 font-medium" : ""}>
                {bn ? `${combo.remaining}টি বাকি` : `${combo.remaining} left`}
              </span>
            )}
          </div>

          {/* Included items */}
          <p className="font-semibold mt-6 mb-2">{bn ? "এই কম্বোতে যা আছে" : "What's included"}</p>
          <ul className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {(combo.items || []).map((item) => (
              <li key={`${item.productId}-${item.variantId}`}>
                <NavLink to={`/productdetails/${item.productSlug || item.productId}`}
                  className="flex items-center gap-3 p-3 hover:bg-teal-50/50 transition-colors">
                  {item.image ? (
                    <img src={`${base_url}${item.image}`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : <div className="w-12 h-12 rounded-lg bg-gray-100" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{pickField(item, "productName", language)}</p>
                    {item.variantLabel && <p className="text-xs text-gray-500">{item.variantLabel}</p>}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    {item.quantity > 1 && <p className="text-xs text-gray-500">× {item.quantity}</p>}
                    <p className="text-gray-400 line-through">{item.price * item.quantity} ৳</p>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex flex-row gap-3 mt-6">
            <button className={actionBtn} onClick={handleAddToCart} disabled={!available}>
              {bn ? "কার্টে যোগ করুন" : "Add to Cart"}
            </button>
            <button className={actionBtn} onClick={handleBuyNow} disabled={!available}>
              {bn ? "এখনই কিনুন" : "Buy Now"}
            </button>
          </div>
          {!available && <p className="text-sm text-red-500 mt-2">{unavailableText}</p>}
        </div>
      </div>

      {description && (
        <div className="w-full px-4 lg:px-5 mt-6">
          <h2 className="text-xl font-bold text-teal-500">{bn ? "বিবরণ" : "Description"}</h2>
          <div className="text-gray-700 bg-white py-2 rounded-lg" dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
    </div>
  );
};

export default ComboDetails;
