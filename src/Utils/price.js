// Cheapest price across a product's active variants (falls back to legacy priceMatrix).
export const getLowestPrice = (product) => {
  const variants = (product?.variants || []).filter(v => v.is_active !== false);
  const source = variants.length ? variants : (product?.priceMatrix || []);
  const prices = source.map(v => parseFloat(v.price)).filter(n => !isNaN(n));
  return prices.length ? Math.min(...prices) : null;
};
