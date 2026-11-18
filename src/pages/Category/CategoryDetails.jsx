import { useState, useEffect } from 'react';
import '../../styles/IItwo.css';
import '../../styles/categorydetails.css';
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from '../Products/ProductCard';
import ProductCardShimmer from '../Products/ProductCardShimmer';
import { location_url } from '../../config/config';
import { useLanguage, pickField } from '../../context/LanguageContext';
import Seo, { bdKeywordsFor } from '../../Utils/Seo';
import { getSlugPath } from '../../Utils/slug';
import { cachedGet, peekCached } from '../../Utils/apiCache';

const subcategoriesOf = (allSubs, category) => {
    const catname = category?.catname?.toLowerCase();
    if (!catname) return [];
    return (allSubs || []).filter((s) => s.catname?.toLowerCase() === catname);
};

// eslint-disable-next-line react/prop-types
const FilterChip = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`px-4 py-1.5 rounded-md border text-sm transition-colors ${
            active
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-600'
        }`}
    >
        {children}
    </button>
);

const CategoryDetails = () => {
    const { id } = useParams();
    const { language } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    // Both requests start together; render once both are in (cached data renders on the first paint).
    const [initial] = useState(() => {
        const details = peekCached(`/categorydetails/${id}`);
        const catnsub = peekCached('/getcatnsub');
        return details && catnsub ? { details, catnsub } : null;
    });
    const [category, setCategory] = useState(initial?.details.category ?? null);
    const [products, setProducts] = useState(initial?.details.products || []);
    const [subcategories, setSubcategories] = useState(() =>
        initial ? subcategoriesOf(initial.catnsub.subcategories, initial.details.category) : []
    );
    const [loading, setLoading] = useState(!initial);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const details = cachedGet(`/categorydetails/${id}`).catch((err) => {
            throw new Error(err.status ? "Failed to fetch category details" : err.message);
        });
        // Site-wide list; if it fails the page still renders, just ungrouped.
        const subs = cachedGet('/getcatnsub')
            .then((data) => data.subcategories || [])
            .catch((err) => {
                console.error('Error fetching subcategories:', err);
                return [];
            });

        Promise.all([details, subs])
            .then(([data, allSubs]) => {
                if (cancelled) return;
                setCategory(data.category);
                setProducts(data.products || []);
                setSubcategories(subcategoriesOf(allSubs, data.category));
                setError(null);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [id]);

    // Only subcategories that have products get a chip, with their count.
    const chips = subcategories
        .map((sub) => ({ sub, count: products.filter((p) => p.subCategory === sub.subcat).length }))
        .filter(({ count }) => count > 0);
    const activeSub = chips.find(({ sub }) => sub._id === searchParams.get('sub'))?.sub || null;
    const visibleProducts = activeSub
        ? products.filter((p) => p.subCategory === activeSub.subcat)
        : products;

    const selectSub = (subId) => {
        const next = new URLSearchParams(searchParams);
        if (subId) next.set('sub', subId);
        else next.delete('sub');
        setSearchParams(next, { replace: true });
    };

    if (loading) return (
        <div className='mx-4 lg:mx-20'>
            {/* Cover, title, filter chips and product grid, shaped like the loaded page */}
            <div className="catdmain">
                <div className="w-full aspect-[5/2] lg:aspect-[4/1] bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            <div className="h-7 w-48 mt-4 lg:mt-6 bg-gray-200 rounded animate-pulse" />
            <div className="flex flex-wrap gap-2 mt-5">
                {[56, 112, 96, 128].map((w) => (
                    <div key={w} className="h-8 bg-gray-200 rounded-md animate-pulse" style={{ width: w }} />
                ))}
            </div>
            <div className="mt-8 mb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3 lg:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardShimmer key={i} fluid />
                ))}
            </div>
        </div>
    );
    if (error) return <><Seo title="Category not found" noindex /><div className="text-center text-red-500 py-10">{error}</div></>;
    if (!category) return <><Seo title="Category not found" noindex /><div>No category found</div></>;


    return (
        <div className='mx-4 lg:mx-20'>
            <Seo
                title={`${category.catname} Printing in Dhaka, Bangladesh — Best Price`}
                description={`${category.catname}${category.catnameBn ? ` (${category.catnameBn})` : ''} printing price in Bangladesh. Order custom ${category.catname} online from PriPackLab, Dhaka — cash on delivery to all 64 districts.`}
                keywords={[
                    ...bdKeywordsFor(category.catname, category.catnameBn),
                    ...subcategories.flatMap((sub) => [sub.subcat, sub.subcatBn, `${sub.subcat} price in Bangladesh`]),
                ]}
                path={`/categorydetails/${getSlugPath(category)}`}
                image={category.pagecover ? `${location_url}${category.pagecover}` : undefined}
            />

            {/* Category Cover + Name */}
            <div className="catdmain">
                <div>
                    <img 
                        src={`${location_url}${category.pagecover}`}
                        alt={category.catname}
                        className='catd-cover'
                    />
                   
                </div>
                 <h1 className="text-black text-2xl lg:text-3xl font-bold mt-4 lg:mt-6">
                        {pickField(category, 'catname', language)}
                    </h1>
            </div>

            {/* Subcategory chips filter the product grid (?sub=<id> keeps it shareable). */}
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                    <FilterChip active={!activeSub} onClick={() => selectSub(null)}>
                        {language === 'bn' ? 'সব' : 'All'} ({products.length})
                    </FilterChip>
                    {chips.map(({ sub, count }) => (
                        <FilterChip
                            key={sub._id}
                            active={activeSub?._id === sub._id}
                            onClick={() => selectSub(sub._id)}
                        >
                            {pickField(sub, 'subcat', language)} ({count})
                        </FilterChip>
                    ))}
                </div>
            )}

            {/* All products of the category in one grid */}
            <div className="mt-8 mb-10">
                {visibleProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3 lg:gap-4">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product._id} product={product} size="fluid" />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-10">
                        No products available for this category.
                    </div>
                )}
            </div>

        </div>
    );
};

export default CategoryDetails;
