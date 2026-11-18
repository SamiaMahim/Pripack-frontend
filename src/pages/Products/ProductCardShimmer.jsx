/* eslint-disable react/prop-types */
// Loading placeholder with the same shape as ProductCard: square image, content-height card.
// fluid fills a grid cell (category page); otherwise it has the fixed row-card widths.
const ProductCardShimmer = ({ fluid = false }) => {
  return (
    <div
      className={`
        block flex-shrink-0 bg-white rounded-xl border border-gray-100 animate-pulse
        ${fluid ? 'w-full min-w-0' : 'w-[44vw] sm:w-[200px] lg:w-[260px] m-1'}
      `}
    >
      {/* Image */}
      <div className="w-full aspect-square bg-gray-200 rounded-t-xl" />

      <div className="p-1.5 sm:p-2">
        {/* Name + stars */}
        <div className="flex justify-between items-start mt-1.5 gap-1">
          <div className="h-3 sm:h-4 bg-gray-200 rounded flex-1" />
          <div className="w-12 h-3 sm:h-4 bg-gray-200 rounded flex-shrink-0" />
        </div>

        {/* Price */}
        <div className="w-16 h-3 sm:h-4 bg-gray-200 rounded mt-1.5" />
      </div>
    </div>
  );
};

export default ProductCardShimmer;
