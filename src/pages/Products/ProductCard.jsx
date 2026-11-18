import '../../styles/IItwo.css';
import { NavLink } from 'react-router-dom';
import { getSlugPath } from '../../Utils/slug';
import { useLanguage, pickField } from '../../context/LanguageContext';
import { base_url } from '../../config/config';

// size="small" is the compact version used for Related Products.
// size="fluid" fills its grid cell (category page grid).
// Images are square at every size; the card is as tall as its content.
const SIZES = {
  default: {
    card: 'w-[44vw] sm:w-[200px] lg:w-[260px] m-1',
  },
  small: {
    card: 'w-[40vw] sm:w-[170px] lg:w-[200px] pb-1 m-1',
  },
  fluid: {
    card: 'w-full min-w-0',
  },
};

const ProductCard = ({ product, size = 'default' }) => {
  const sizeClasses = SIZES[size] || SIZES.default;
  const { language } = useLanguage();
  const getImageUrl = (filePath) => (filePath ? `${base_url}${filePath}` : '');

  const getProductId = (product) => {
    if (!product) return null;

    // Normal MongoDB id
    if (typeof product._id === 'string') return product._id;

    // Sometimes MongoDB id comes like { $oid: "..." }
    if (product._id?.$oid) return product._id.$oid;

    // Fallback
    return product.id || null;
  };

  if (!product) return null;

  const productId = getProductId(product);

  if (!productId) {
    console.warn('Product id missing:', product);
    return null;
  }

  return (
    <NavLink
      to={`/productdetails/${getSlugPath(product) || productId}`}
      className={`
        block flex-shrink-0 cursor-pointer bg-white rounded-xl border border-gray-100
        hover:scale-105 duration-500
        ${sizeClasses.card}
      `}
    >
      {/* Image */}
      <img
        src={getImageUrl(product.mainPics?.[0])}
        alt={product.productName || 'Product'}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="w-full aspect-square object-cover rounded-t-xl bg-gray-50"
      />

      <div className="p-1.5 sm:p-2">
        <p
          className="
            font-bold leading-tight truncate mt-1.5
            text-[11px] sm:text-sm
          "
        >
          {pickField(product, 'productName', language)}
        </p>

        {/* Lowest price */}
        {product.minPrice != null && (
          <p
            className="
              font-semibold text-indigo-600 mt-0.5
              text-[11px] sm:text-sm
            "
          >
            ৳ {Number(product.minPrice).toLocaleString('en-BD')}
          </p>
        )}
      </div>
    </NavLink>
  );
};

export default ProductCard;