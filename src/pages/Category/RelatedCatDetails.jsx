import { useState, useEffect } from 'react';
import '../../styles/IItwo.css';
import '../../styles/categorydetails.css';
import { useParams } from "react-router-dom";
import Productlist from '../Products/Productlist';
import ProductlistShimmer from '../Products/ProductlistShimmer';
import { base_url } from '../../config/config';
import { location_url } from '../../config/config';
import { useLanguage, pickField } from '../../context/LanguageContext';
import Seo, { bdKeywordsFor } from '../../Utils/Seo';
import { getSlugPath } from '../../Utils/slug';
const RelatedCatDetails = () => {
    const { id } = useParams();
    const { language } = useLanguage();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await fetch(`${base_url}/relatedproducts/${id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch category details");
                }

                const data = await response.json();

                // Fix: Save category and products separately
                setCategory(data.category);
                setProducts(data.products || []);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [id]);

    if (loading) return (
        <div className='mx-4 lg:mx-20'>
            <div className="catdmain">
                <div className="w-full h-48 lg:h-[300px] bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="mt-10">
                <ProductlistShimmer showTitle={false} />
            </div>
        </div>
    );
    if (error) return <><Seo title="Category not found" noindex /><div className="text-center text-red-500 py-10">{error}</div></>;
    if (!category) return <><Seo title="Category not found" noindex /><div>No category found</div></>;

    return (
        <div className='mx-4 lg:mx-20'>
            {/* Same listing as the category page, so point search engines there. */}
            <Seo
                title={`${category.catname} Printing in Dhaka, Bangladesh — Best Price`}
                description={`${category.catname}${category.catnameBn ? ` (${category.catnameBn})` : ''} printing price in Bangladesh. Order online from PriPackLab, Dhaka — cash on delivery to all 64 districts.`}
                keywords={bdKeywordsFor(category.catname, category.catnameBn)}
                path={`/categorydetails/${getSlugPath(category)}`}
            />

            {/* Category Cover + Name */}
            <div className="catdmain">
                <div>
                    <img
                        src={`${location_url}${category.pagecover}`}
                        alt={category.catname}
                        className="catd-cover"
                    />
                    <h1 className="text-black text-3xl font-bold mt-3">
                        {pickField(category, 'catname', language)}
                    </h1>
                </div>
            </div>

            {/* Product List */}
            <div className="mt-10">
                {products.length > 0 ? (
                    <Productlist products={products} />
                ) : (
                    <div className="text-gray-500 text-center py-10">
                        No products available for this category.
                    </div>
                )}
            </div>

        </div>
    );
};

export default RelatedCatDetails;
