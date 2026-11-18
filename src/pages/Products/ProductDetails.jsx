import '../../styles/IItwo.css';
import '../../styles/blog.css';
import '../../styles/review.css';
import '../../styles/productview.css';

import { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Share2, MessageCircle } from 'lucide-react';

import { base_url } from '../../config/config';
import Steps from './steps';
import { openSupportChat } from '../../Utils/chatBridge';
import SellerChatWidget from '../supportchat/SellerChatWidget';
import { useLanguage, pickField } from '../../context/LanguageContext';
import Seo, { SITE_URL, toMetaDescription, bdKeywordsFor } from '../../Utils/Seo';
import { getSlugPath } from '../../Utils/slug';
import { addToCart } from "../../Utils/cartApi";
import { cachedGet, peekCached } from "../../Utils/apiCache";

const Comments = lazy(() => import('../Comments/comments'));
const Reviews = lazy(() => import('../Reviews/Reviews'));
const VerticalProductlist = lazy(() => import('./VerticalProductlist'));

const getImageUrl = (filePath) => {
  if (!filePath) return "";

  if (filePath.startsWith("http")) return filePath;

  return `${base_url}${filePath}`;
};

// Everything the page derives from a /productdetails response.
const pageStateFrom = (data) => {
  const productData = data?.product || null;
  const firstActive = (productData?.variants || []).find(v => v.is_active);
  return {
    product: productData,
    related: data?.relatedProducts || [],
    process: data?.process || [],
    criteria: firstActive?.combination || {},
    variant: firstActive || null,
    image: productData?.mainPics?.length > 0 ? getImageUrl(productData.mainPics[0]) : null,
  };
};

// Layout-matching placeholder while the product loads.
const ProductDetailsSkeleton = () => (
  <div className='flex flex-col mb-10 lg:flex-row mt-10 items-start justify-center w-full min-h-screen' aria-busy="true" aria-label="Loading product">
    <div className='flex flex-col lg:w-[70%] w-full px-4 lg:px-0'>
      <div className='flex flex-col lg:flex-row w-full pt-4 lg:pt-10 animate-pulse'>
        <div className='flex lg:flex-row flex-col-reverse py-4 lg:p-5 lg:w-1/2 min-w-0'>
          <div className='flex-shrink-0 lg:w-20 lg:mr-2 mt-3 lg:mt-0 flex lg:flex-col flex-row gap-2'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='flex-shrink-0 lg:h-[80px] lg:w-[80px] w-[70px] h-[70px] rounded-md bg-gray-200' />
            ))}
          </div>
          <div className='flex-1 aspect-square bg-gray-200 rounded' />
        </div>
        <div className='py-4 lg:p-4 lg:w-1/2 min-w-0 space-y-4'>
          <div className='h-8 w-3/4 bg-gray-200 rounded' />
          <div className='h-7 w-1/3 bg-gray-200 rounded' />
          <div className='h-4 w-1/4 bg-gray-200 rounded mt-6' />
          <div className='flex gap-2'>
            <div className='h-8 w-16 bg-gray-200 rounded' />
            <div className='h-8 w-16 bg-gray-200 rounded' />
            <div className='h-8 w-16 bg-gray-200 rounded' />
          </div>
          <div className='flex gap-3 pt-2'>
            <div className='h-10 w-32 bg-gray-200 rounded-lg' />
            <div className='h-10 w-32 bg-gray-200 rounded-lg' />
          </div>
          <div className='h-10 w-[268px] bg-gray-200 rounded-lg' />
        </div>
      </div>
    </div>
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // A cached response (e.g. back navigation) renders on the first paint.
  const [initial] = useState(() => {
    const cached = peekCached(`/productdetails/${id}`);
    return cached?.product ? pageStateFrom(cached) : null;
  });

  const [product, setProduct] = useState(initial?.product ?? null);
  const [process, setProcess] = useState(initial?.process || []);
  const [relativeproducts, setrelativeProducts] = useState(initial?.related || []);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(initial?.image ?? null);
  const [selectedCriteria, setSelectedCriteria] = useState(initial?.criteria || {});
  const [selectedVariant, setSelectedVariant] = useState(initial?.variant ?? null);
  const shownProductRef = useRef(initial?.product ?? null);

  useEffect(() => {
    let cancelled = false;
    const path = `/productdetails/${id}`;

    const apply = (data) => {
      const next = pageStateFrom(data);
      if (next.product === shownProductRef.current) return; // already on screen
      shownProductRef.current = next.product;
      setProduct(next.product);
      setrelativeProducts(next.related);
      setProcess(next.process);
      setSelectedCriteria(next.criteria);
      setSelectedVariant(next.variant);
      setSelectedImage(next.image);
    };

    const cached = peekCached(path);
    if (cached?.product) {
      setError(null);
      apply(cached);
      return undefined;
    }

    setError(null);
    shownProductRef.current = null;
    setProduct(null);
    setSelectedImage(null);
    setSelectedCriteria({});
    setSelectedVariant(null);

    cachedGet(path)
      .then((data) => {
        if (cancelled) return;
        if (!data?.product) {
          setError("No product found");
          return;
        }
        apply(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.status ? "Failed to fetch product data" : err.message);
      });

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!product?.variants || !product?.criteria) return;

    const criteriaKeys = product.criteria.map(c => c.name);
    const allSelected = criteriaKeys.every(key => selectedCriteria[key]);

    if (!allSelected) {
      setSelectedVariant(null);
      return;
    }

    const matched = product.variants.find(v =>
      v.is_active &&
      criteriaKeys.every(key => v.combination?.[key] === selectedCriteria[key])
    );

    setSelectedVariant(matched || null);
  }, [selectedCriteria, product]);

  const handleCriteriaSelect = (criteriaName, value) => {
    setSelectedCriteria(prev => ({
      ...prev,
      [criteriaName]: value,
    }));
  };

  const availableVariantMap = useMemo(() => {
    const map = {};

    if (!product?.variants) return map;

    product.variants.forEach((variant) => {
      if (!variant.is_active) return;

      Object.entries(variant.combination || {}).forEach(([key, value]) => {
        if (!map[key]) map[key] = new Set();
        map[key].add(value);
      });
    });

    return map;
  }, [product]);

  const isValueAvailable = (criteriaName, value) => {
    if (!product?.variants) return false;

    return product.variants.some(v => {
      if (!v.is_active) return false;
      if (v.combination?.[criteriaName] !== value) return false;

      return Object.entries(selectedCriteria).every(([key, val]) => {
        if (key === criteriaName) return true;
        return v.combination?.[key] === val;
      });
    });
  };

  if (error) {
    return (
      <>
        <Seo title="Product not found" noindex />
        <p className="text-center text-red-500 mt-10">{error}</p>
      </>
    );
  }

  if (!product) {
    return <ProductDetailsSkeleton />;
  }

  const {
    _id,
    category,
    productName,
    criteria = [],
    mainPics = [],
  } = product;

  const displayName = pickField(product, 'productName', language);
  const displayDescription = pickField(product, 'productDescription', language);

  // Variant price is the discounted price; back out the pre-discount price.
  // Shown until every option is picked: the cheapest active variant.
  const variantPrices = (product?.variants || [])
    .filter((v) => v.is_active !== false)
    .map((v) => parseFloat(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const lowestPrice = variantPrices.length ? Math.min(...variantPrices) : null;
  const discountPct = parseFloat(selectedVariant?.discount) || 0;
  const originalPrice = discountPct > 0 && discountPct < 100
    ? Math.round(parseFloat(selectedVariant.price) / (1 - discountPct / 100))
    : null;

  const productPath = `/productdetails/${getSlugPath(product)}`;
  const activePrices = (product.variants || [])
    .filter(v => v.is_active)
    .map(v => parseFloat(v.price))
    .filter(n => !Number.isNaN(n));
  const lowPrice = activePrices.length > 0 ? Math.min(...activePrices) : null;
  const highPrice = activePrices.length > 0 ? Math.max(...activePrices) : null;
  const priceText = lowPrice === null ? '' : lowPrice === highPrice ? `৳${lowPrice}` : `৳${lowPrice}–৳${highPrice}`;

  // Bangladeshi shoppers search "<product> price in Bangladesh", so lead with that, then the product copy.
  const metaLead = `${productName} price in Bangladesh${priceText ? ` ${priceText}` : ''}. Order online from Dhaka with cash on delivery to all 64 districts.`;
  const descRoom = 200 - metaLead.length;
  const metaDescription = descRoom >= 40
    ? `${metaLead} ${toMetaDescription(product.productDescription, descRoom)}`.trim()
    : metaLead;
  const productKeywords = [
    ...bdKeywordsFor(productName, product.productNameBn),
    ...bdKeywordsFor(product.subCategory),
    ...bdKeywordsFor(category),
    ...(product.tags || []),
  ];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    image: mainPics.map(getImageUrl),
    description: toMetaDescription(product.productDescription, 500) || metaDescription,
    sku: String(_id),
    category,
    brand: { '@type': 'Brand', name: product.sellerName || 'PriPackLab' },
    ...(lowPrice !== null && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BDT',
        lowPrice,
        highPrice,
        offerCount: activePrices.length,
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}${productPath}`,
        eligibleRegion: { '@type': 'Country', name: 'BD' },
        areaServed: { '@type': 'Country', name: 'Bangladesh' },
        seller: { '@type': 'Organization', name: product.sellerName || 'PriPackLab' },
      },
    }),
    ...(product.totalRatings > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.totalRatings,
      },
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: productName, item: `${SITE_URL}${productPath}` },
    ],
  };

  // Matches the Add to Cart / Buy Now buttons, spanning the width of both.
  const chatButtonClass = "flex items-center justify-center gap-2 h-10 w-[268px] rounded-lg text-sm font-semibold shadow-md border-2 hover:bg-teal-500 hover:text-white border-teal-500 hover:border-teal-600 text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200";

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      Swal.fire({
        icon: "error",
        title: "Missing selection",
        text: "Please select all options before adding to cart.",
      });
      return;
    }

    const productToAdd = {
      productId: String(_id),
      productName,
      selectedImage,
      combination: selectedVariant.combination,
      label: selectedVariant.label,
      selectedPrice: selectedVariant.price,
      mainPics,
      units: 1,
      selectedQty: 1,
      sellerId: product.sellerId || null,
      sellerName: product.sellerName || null,
      
    };

    let status;
    try {
      status = await addToCart(productToAdd);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Could not add to cart", text: err.message });
      return;
    }

    if (status === "exists") {
      Swal.fire({
        icon: "warning",
        title: "Already in Cart",
        text: "This product is already added to your cart.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Added!",
      text: "Product added to cart successfully.",
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant) {
      Swal.fire({
        icon: "error",
        title: "Missing selection",
        text: "Please select all options before proceeding.",
      });
      return;
    }

    const buyNowItem = {
      productId: String(_id),
      productName,
      selectedImage,
      combination: selectedVariant.combination,
      label: selectedVariant.label,
      selectedPrice: selectedVariant.price,
      mainPics,
      units: 1,
      selectedQty: 1,
      sellerId: product.sellerId || null,
      sellerName: product.sellerName || null,
    };

    localStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
    navigate("/checkout");
  };

  // The Clipboard API only exists on HTTPS/localhost; older copy route covers the rest.
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    if (!ok) throw new Error("Copy failed");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      await copyText(shareUrl);
      Swal.fire({
        icon: "success",
        title: "Link copied!",
        text: "Product link copied to clipboard.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ icon: "error", title: "Could not copy link" });
    }
  };

  return (
    <div className='flex flex-col  mb-10 lg:flex-row mt-10 items-start justify-center w-full'>
      <Seo
        title={`${productName} Price in Bangladesh`}
        description={metaDescription}
        keywords={productKeywords}
        path={productPath}
        image={mainPics[0] ? getImageUrl(mainPics[0]) : undefined}
        type="product"
        jsonLd={[productSchema, breadcrumbSchema]}
      />
      <div className='flex flex-col lg:w-[70%] w-full px-4 lg:px-0'>
        <div className='flex flex-col lg:flex-row w-full pt-4 lg:pt-10'>
          <div className='flex lg:flex-row flex-col-reverse py-4 lg:p-5 lg:w-1/2 min-w-0'>
            <div className='flex-shrink-0 lg:w-20 lg:mr-2 mt-3 lg:mt-0 flex lg:flex-col flex-row gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto'>
              {mainPics.map((img, index) => (
                <img
                  key={index}
                  className='flex-shrink-0 lg:h-[80px] lg:w-[80px] w-[70px] h-[70px] object-cover rounded-md cursor-pointer hover:opacity-80'
                  src={getImageUrl(img)}
                  alt={`${displayName} ${index + 1}`}
                  loading="lazy"
                  onClick={() => setSelectedImage(getImageUrl(img))}
                />
              ))}
            </div>

            <div className='flex-1 aspect-square flex items-center justify-center'>
              <img
                className='w-full h-full object-cover'
                src={selectedImage || getImageUrl(mainPics[0])}
                alt={displayName}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>

          <div className='py-4 lg:p-4 lg:w-1/2 min-w-0'>
            <div className='flex items-center justify-between gap-3'>
              <h1 className='text-xl lg:text-3xl font-semibold'>{displayName}</h1>

              <button
                onClick={handleShare}
                title="Share this product"
                className='flex items-center justify-center h-9 w-9 shrink-0 rounded-full border border-gray-200 text-gray-500 hover:border-teal-500 hover:text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200'
              >
                <Share2 className='w-4 h-4' />
              </button>
            </div>

            <div className='flex flex-row items-baseline gap-2 mt-2'>
              <p className="text-base font-semibold text-black">Price:</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedVariant ? `${selectedVariant.price} ৳` : lowestPrice != null ? `${lowestPrice} ৳` : ""}
              </p>
              {originalPrice && (
                <p className="text-base text-gray-400 line-through">
                  {originalPrice} ৳
                </p>
              )}
            </div>

            {discountPct > 0 && (
              <p className='mt-1 text-sm text-gray-500'>
                Discount:{' '}
                <span className='text-red-500 font-semibold'>{discountPct}%</span>
              </p>
            )}

            {criteria.map((criterion) => (
              <div key={criterion.name}>
                <p className='font-semibold mt-4'>{criterion.name}</p>

                <div className='flex flex-wrap gap-2 mt-1'>
                  {(criterion.values || []).map((value, index) => {
                    const available = isValueAvailable(criterion.name, value);
                    const isSelected = selectedCriteria[criterion.name] === value;

                    return (
                      <div
                        key={index}
                        onClick={() => available && handleCriteriaSelect(criterion.name, value)}
                        className={`px-2 py-1 rounded transition-all duration-200 border
                          ${
                            !available
                              ? "opacity-40 cursor-not-allowed border-gray-300 text-gray-400"
                              : isSelected
                                ? "bg-teal-500 text-white font-semibold border-transparent shadow-md cursor-pointer hover:bg-teal-600 hover:scale-105 active:scale-95"
                                : "border-teal-500 font-semibold text-teal-600 cursor-pointer hover:border-teal-600 hover:scale-105 active:scale-95"
                          }`}
                      >
                        <p className='font-semibold'>{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className='flex flex-row gap-3 mt-6'>
              <button
                className="h-10 w-32 rounded-lg text-sm font-semibold shadow-md border-2 hover:bg-teal-500 hover:text-white border-teal-500 hover:border-teal-600 text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              <button
                className="h-10 w-32 rounded-lg text-sm font-semibold shadow-md border-2 hover:bg-teal-500 hover:text-white border-teal-500 hover:border-teal-600 text-teal-600 hover:scale-105 active:scale-95 transition-all duration-200"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
            </div>

            {/* Seller products chat with the seller directly; others go to support */}
            <div className='mt-3'>
              {product.sellerId ? (
                <SellerChatWidget
                  sellerId={product.sellerId}
                  sellerName={product.sellerName}
                  productId={String(_id)}
                  productName={displayName}
                  buttonClassName={chatButtonClass}
                />
              ) : (
                <button
                  onClick={() => openSupportChat({
                    prefillText: `Hi, I have a question about "${displayName}".`,
                    productId: String(_id),
                    productName: displayName,
                  })}
                  className={chatButtonClass}
                >
                  <MessageCircle size={16} />
                  Ask Seller
                </button>
              )}
            </div>
          </div>
        </div>

        <Steps process={process} />

        <div className="w-full ">
          <h2 className="text-xl font-bold text-teal-500 ">Description</h2>
          <div
            className="text-gray-700 bg-white py-2 rounded-lg"
            dangerouslySetInnerHTML={{ __html: displayDescription }}
          />
        </div>

        <Suspense fallback={<p className="text-center text-gray-400">Loading reviews...</p>}>
          <Reviews productId={_id} />
        </Suspense>

        <Suspense fallback={<p className="text-center text-gray-400">Loading comments...</p>}>
          <Comments productId={_id} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <VerticalProductlist products={relativeproducts} category={category} />
      </Suspense>
    </div>
  );
};

export default ProductDetails;