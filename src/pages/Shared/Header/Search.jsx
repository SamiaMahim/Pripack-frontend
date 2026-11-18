import search from '/assets/srch.png';
import '../../../styles/search.css';
import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { base_url } from '../../../config/config';
import useProductSearch from '../../../Utils/useProductSearch';
import { getSlugPath } from '../../../Utils/slug';
import { useLanguage, pickField } from '../../../context/LanguageContext';
const Search = () => {
  const { language } = useLanguage();
  const [searchText, setSearchText] = useState("");
  const { results: filteredProducts, loading } = useProductSearch(searchText);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close the results on a click/tap outside the search box or on Escape.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);


  return (
    <div ref={boxRef} className="srmain ">
   
        <div className="relative srdiv ml-6 ">
          <input 
            type="text"
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            
            
          />
                
       
          <button className='absolute right-0.5 top-1/2 mt-1 -translate-y-1/2 w-10  h-8 '>
          <img src={search} alt="search" className='w-6' />
        </button>

      {open && searchText.trim() && filteredProducts.length === 0 && (
        <div className="srbot">
          <p className="px-4 py-3 text-sm text-gray-500">{loading ? "Searching…" : "No products found"}</p>
        </div>
      )}
      {open && filteredProducts.length > 0 && (
        <div className="srbot">
          {filteredProducts.map((product) => (
            <NavLink
              to={`/productdetails/${getSlugPath(product)}`}
              key={product._id}
              className="srbotm"
              onClick={() => { setSearchText(""); setOpen(false); }}
            >
              <div className="srid">
                <div className="sri">
                  <img
                   src={product.image ? `${base_url}${product.image}` : ''}
                    
                    alt={product.productName}
                  />
                </div>

                <div className="flex flex-col">
                  <p className="font-bold text-sm">
                    {pickField(product, 'productName', language)}
                  </p>

                  <div className="text-sm flex flex-row items-center">
                    <div className="rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            backgroundColor: Math.round(product.avgRating) >= star ? '#FFA500' : '#ddd',
                            clipPath:
                              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                            marginRight: '2px',
                          }}
                        />
                      ))}
                    </div>
                    <span className="ml-1">
                      ({product.totalRatings || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="catp">
  <p>{product.category}</p>
  <p>
    {product.minPrice != null ? `from ৳ ${product.minPrice}` : "৳ N/A"}
  </p>
</div>

            </NavLink>
          ))}
        </div>
      )}
         </div>
    </div>
  );
};

export default Search;
