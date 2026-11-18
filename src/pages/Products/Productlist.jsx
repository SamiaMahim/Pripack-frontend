/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import '../../styles/IItwo.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlugPath } from '../../Utils/slug';
import ProductCard from './ProductCard';

// Home rows get a preview of each category; "See All" opens the category page with the rest.
const DEFAULT_STEP = 270; // card width + gap in px, until the real one is measured

const Productlist = ({ products, categoryName, category }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [visibleCount, setVisibleCount] = useState(1);
    const [step, setStep] = useState(DEFAULT_STEP);
    const directionRef = useRef(1); // 1 = forward, -1 = back
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const totalItems = products.length;

    // Card spacing (cards are narrower on phones) and how many fit, so the row
    // never slides past its last card into empty space.
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return undefined;
        const measure = () => {
            const cards = trackRef.current?.children || [];
            const measured = cards.length > 1
                ? cards[1].offsetLeft - cards[0].offsetLeft
                : cards[0]?.offsetWidth;
            const cardStep = measured > 0 ? measured : DEFAULT_STEP;
            setStep(cardStep);
            setVisibleCount(Math.max(1, Math.floor(el.clientWidth / cardStep)));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [totalItems]);

    const maxIndex = Math.max(0, totalItems - visibleCount);

    // Keep the position valid when the window gets wider.
    useEffect(() => {
        setCurrentIndex((i) => Math.min(i, maxIndex));
    }, [maxIndex]);

    // Auto-scroll back and forth: turn around at either end instead of showing blank space.
    useEffect(() => {
        if (isHovered || maxIndex === 0) return undefined;
        const interval = setInterval(() => {
            setCurrentIndex((i) => {
                if (i + directionRef.current > maxIndex || i + directionRef.current < 0) {
                    directionRef.current = -directionRef.current;
                }
                return i + directionRef.current;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [isHovered, maxIndex]);

    const goTo = (index) => {
        const next = Math.min(Math.max(index, 0), maxIndex);
        directionRef.current = next >= currentIndex ? 1 : -1;
        setCurrentIndex(next);
    };


    return (
        <div className='bg-white'>
            <div className='h-auto mt-10 w-full mb-10'>
                <div className='flex flex-row justify-between items-center mx-2 mb-5'>
                    <h2 className='text-xl font-bold text-teal-500'>{categoryName}</h2>
                    {category && (
                        <Link
                            to={`/categorydetails/${getSlugPath(category)}`}
                            className='text-sm cursor-pointer hover:text-indigo-500'
                        >
                            See All{category.productCount > products.length ? ` (${category.productCount})` : ''}
                        </Link>
                    )}
                </div>
                <div
                    ref={viewportRef}
                    className='relative overflow-hidden'
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div
                        ref={trackRef}
                        className='flex transition-transform duration-1000 ease-in-out'
                        style={{
                            transform: `translateX(-${currentIndex * step}px)`,
                            width: `${step * totalItems}px`,
                        }}
                    >
                        {products.map((product) => (
                      <   ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    {currentIndex > 0 && (
                        <button
                            type='button'
                            aria-label='Previous products'
                            className='carousel-arrow left-2'
                            onClick={() => goTo(currentIndex - 1)}
                        >
                            <ChevronLeft className='w-5 h-5' strokeWidth={2.5} />
                        </button>
                    )}
                    {currentIndex < maxIndex && (
                        <button
                            type='button'
                            aria-label='Next products'
                            className='carousel-arrow right-2'
                            onClick={() => goTo(currentIndex + 1)}
                        >
                            <ChevronRight className='w-5 h-5' strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Productlist;