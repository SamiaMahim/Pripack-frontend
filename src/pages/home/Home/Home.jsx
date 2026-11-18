import Category from "../../Category/Category";
import Productlist from "../../Products/Productlist";
import HomeShimmer from "./HomeShimmer";
import Banner2 from "../Banner/Banner2";
import { Fragment, useEffect, useRef, useState } from "react";
import ProductlistShimmer from "../../Products/ProductlistShimmer";
import { base_url } from "../../../config/config";
import Adds, { findSidebarAd } from "../Ads/Ads";
import ComboList from "../../Combo/ComboList";
import { useLanguage, pickField } from "../../../context/LanguageContext";
import Seo from "../../../Utils/Seo";
import { cachedGet, peekCached } from "../../../Utils/apiCache";

// First paint only needs the first 16 categories, the first 4 product rows and
// 10 products per row. More rows load 2 at a time as the user scrolls down
// (cursor pagination via /homerows); "See all" loads the rest of a row.
const FIRST_ROWS = 4;
const MORE_ROWS = 2;
const PRODUCTS_PER_ROW = 10;
const HOME_PATH = `/gethome?cats=16&products=${PRODUCTS_PER_ROW}&rows=${FIRST_ROWS}`;
const rowsPath = (cursor) => `/homerows?cursor=${cursor}&limit=${MORE_ROWS}&products=${PRODUCTS_PER_ROW}`;
// The left/right sidebar ads (tall 1:4 strips) sit beside the product rows and
// follow the scroll. Below 1280 px there is no room at the sides, so they hide.
const SIDE_COLUMN = "hidden xl:block w-[160px] 2xl:w-[180px] shrink-0 sticky top-24 mt-4";
// A "Between Rows" ad goes after every this many product rows (not after the last).
const ROWS_PER_AD = 2;

const Home = () => {
    const { language } = useLanguage();
    // Cached /gethome (e.g. coming back from a product page) renders straight away, no skeleton.
    const [cached] = useState(() => peekCached(HOME_PATH));
    const [cats, setCats] = useState(cached?.cats || []);
    const [totalCats, setTotalCats] = useState(cached?.totalCats || 0);
    const [banners, setBanners] = useState(cached?.banner || []);
    const [ads, setAds] = useState(cached?.ads || []);
    const [categories, setCategories] = useState(cached?.categories || []);
    const [combos, setCombos] = useState(cached?.combos || []);
    const [loading, setLoading] = useState(!cached); // ✅
    const [nextCursor, setNextCursor] = useState(cached?.nextCursor || null);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadingMoreRef = useRef(false);
    const sentinelRef = useRef(null);

    useEffect(() => {
        fetch(`${base_url}/vcount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ increment: 1 }),
        }).catch(error => console.error('Error updating visitor count:', error));
    }, []);

    useEffect(() => {
        cachedGet(HOME_PATH)
            .then(data => {
                setCats(data.cats || []);
                setTotalCats(data.totalCats || 0);
                setCategories(data.categories || []);
                setNextCursor(data.nextCursor || null);
                setBanners(data.banner || []);
                setAds(data.ads || []);
                setCombos(data.combos || []);
            })
            .catch(error => console.error('Error fetching data:', error))
            .finally(() => setLoading(false)); // ✅
    }, []);

    // Load the next rows when the bottom of the list comes near the screen.
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !nextCursor) return undefined;
        const observer = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting || loadingMoreRef.current) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
            cachedGet(rowsPath(nextCursor))
                .then((data) => {
                    setCategories((prev) => {
                        const seen = new Set(prev.map((c) => c._id));
                        return [...prev, ...(data.rows || []).filter((c) => !seen.has(c._id))];
                    });
                    setNextCursor(data.nextCursor || null);
                })
                .catch((error) => {
                    console.error('Error loading more rows:', error);
                    setNextCursor(null); // stop trying; the rows already shown stay
                })
                .finally(() => {
                    loadingMoreRef.current = false;
                    setLoadingMore(false);
                });
        }, { rootMargin: '600px 0px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [nextCursor, loading]);

    // Rendered in both states so the title/canonical are set before the API responds; /home canonicalizes to /.
    const seo = (
        <Seo
            path="/"
            keywords={[
                ...cats.flatMap((cat) => [cat.catname, cat.catnameBn, `${cat.catname} printing Dhaka`, `${cat.catname} price in Bangladesh`]),
                'best printing press in Dhaka',
                'online printing service in Bangladesh',
                'corporate printing Bangladesh',
                'product packaging box Bangladesh',
            ]}
        />
    );

    const productRows = categories.filter(cat => cat.products?.length > 0);
    const hasLeftAd = Boolean(findSidebarAd(ads, 'hls'));
    const hasRightAd = Boolean(findSidebarAd(ads, 'hrs'));
    const renderRow = (cat) => (
        <Productlist
            key={cat._id}
            categoryName={pickField(cat, 'catname', language)}
            category={cat}
            products={cat.products}
        />
    );

    if (loading) return (
        <div className="lg:mx-20">
            {seo}
            <HomeShimmer />
        </div>
    );

    return (
        <div className="lg:mx-20">
            {seo}
            <h1 className="sr-only">PriPackLab — Online Printing & Packaging Shop in Dhaka, Bangladesh</h1>
            <Banner2 banner={banners} />
            <Adds ads={ads} location="Header" />
            <Category categories={cats} totalCount={totalCats} />
            <ComboList combos={combos} />
            <Adds ads={ads} location="Popup" />
            <Adds ads={ads} location="Homepage Banner" />
            <div className="xl:flex xl:items-start xl:gap-4">
                {hasLeftAd && (
                    <aside className={SIDE_COLUMN}>
                        <Adds ads={ads} location="hls" />
                    </aside>
                )}
                <div className="min-w-0 flex-1">
                    {productRows.map((cat, i) => (
                        <Fragment key={cat._id}>
                            {renderRow(cat)}
                            {(i + 1) % ROWS_PER_AD === 0 && i < productRows.length - 1 && (
                                <Adds ads={ads} location="Between Rows" slot={(i + 1) / ROWS_PER_AD - 1} />
                            )}
                        </Fragment>
                    ))}
                    {loadingMore && <ProductlistShimmer />}
                    {/* Reaching this loads the next rows */}
                    {nextCursor && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}
                </div>
                {hasRightAd && (
                    <aside className={SIDE_COLUMN}>
                        <Adds ads={ads} location="hrs" />
                    </aside>
                )}
            </div>
            <Adds ads={ads} location="Footer" />
        </div>
    );
};

export default Home;