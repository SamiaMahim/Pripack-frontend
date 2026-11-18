import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { cachedGet } from '../../Utils/apiCache';
import { getSlugPath } from '../../Utils/slug';
import Seo from '../../Utils/Seo';

// Subcategories no longer have their own page: the category page lists every
// product and filters by subcategory chip. Old /subcategorydetails/:id links
// land on the category page with that chip selected.
const Subcategory = () => {
    const { id } = useParams();
    const [target, setTarget] = useState(null);

    useEffect(() => {
        let cancelled = false;
        cachedGet('/getcatnsub')
            .then(({ categories = [], subcategories = [] }) => {
                const sub = subcategories.find((s) => s._id === id);
                const cat = sub && categories.find((c) => c.catname?.toLowerCase() === sub.catname?.toLowerCase());
                if (!cancelled) setTarget(cat ? `/categorydetails/${getSlugPath(cat)}?sub=${sub._id}` : '/');
            })
            .catch(() => { if (!cancelled) setTarget('/'); });
        return () => { cancelled = true; };
    }, [id]);

    if (target) return <Navigate to={target} replace />;
    return (
        <>
            <Seo title="Redirecting" noindex />
            <div className="h-40" />
        </>
    );
};

export default Subcategory;
