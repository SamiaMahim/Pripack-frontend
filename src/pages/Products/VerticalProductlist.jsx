/* eslint-disable react/prop-types */
import '../../styles/IItwo.css';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

// The backend sends 5; the slice also covers an older backend that sends more.
const MAX_SHOWN = 5;

const VerticalProductlist = ({ products, category }) => {
  const navigate = useNavigate();
  const handleSeeAllClick  = (id) => navigate(`/relatedproducts/${id}`);

  if (!products || products.length === 0) return null;

  const shown = products.slice(0, MAX_SHOWN);

  return (
    <div className="mt-10 flex flex-col lg:items-center items-start w-full px-4 lg:px-0 lg:w-auto lg:ml-5">

      <h2 className="w-full text-xl font-bold text-teal-500 mb-2">
        Related Products
      </h2>

      {/*
        Mobile:  horizontal scroll of small product cards
        Desktop: vertical stack of small product cards
      */}
      <div className="
        w-full
        flex lg:flex-col
        flex-row
        overflow-x-auto lg:overflow-x-visible
        gap-1 pb-2 lg:pb-0
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
      ">
        {shown.map((product) => (
          <ProductCard key={product._id} product={product} size="small" />
        ))}
      </div>

      {/* View All */}
      <button
        onClick={() => handleSeeAllClick(category)}
        className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors underline underline-offset-2"
      >
        View All
      </button>

    </div>
  );
};

export default VerticalProductlist;