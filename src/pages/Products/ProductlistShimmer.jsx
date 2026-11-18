/* eslint-disable react/prop-types */
import ProductCardShimmer from './ProductCardShimmer';

// Placeholder for a Productlist row: title + "See All" and one line of cards
// (the real row slides sideways, it never wraps).
const ProductlistShimmer = ({ count = 6, showTitle = true }) => {
  return (
    <div className="bg-white">
      <div className="h-auto mt-10 w-full mb-10">
        {showTitle && (
          <div className="flex flex-row justify-between items-center mx-2 mb-5">
            <div className="h-6 w-40 sm:w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
          </div>
        )}

        <div className="flex flex-nowrap overflow-hidden">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardShimmer key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductlistShimmer;
