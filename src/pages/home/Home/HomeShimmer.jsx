import ProductlistShimmer from '../../Products/ProductlistShimmer';

// Loading placeholder for the home page, laid out like the real page:
// banner (Banner2), "Shop by Category" (Category), then product rows (Productlist).
const HomeShimmer = () => (
  <div aria-busy="true" aria-label="Loading">
    {/* Banner: same offset under the fixed header and same height as Banner2 */}
    <div className="mt-24 h-[200px] lg:h-[400px] w-full bg-gray-200 animate-pulse" />

    {/* Shop by Category */}
    <section className="w-full mt-10 mb-6">
      <div className="flex flex-row justify-between items-center mx-2 mb-5">
        <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Mobile: one row of round icons with a name under each */}
      <div className="flex lg:hidden gap-4 overflow-hidden pb-2 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px]">
            <div className="w-[72px] h-[72px] rounded-full bg-gray-200 animate-pulse" />
            <div className="h-2.5 w-14 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Desktop: square category cards */}
      <div className="hidden lg:grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-5 px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    </section>

    {/* Product rows */}
    <ProductlistShimmer />
    <ProductlistShimmer />
  </div>
);

export default HomeShimmer;
