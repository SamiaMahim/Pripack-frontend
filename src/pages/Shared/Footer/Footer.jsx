import { thumb } from '../../../Utils/thumb';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useState, useEffect, useContext } from 'react';
import { ShoppingCart, Home, User, Power, LogIn, LayoutGrid, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../Auth/Authprovider';
import { profilePathFor } from '../../../Utils/partnerApi';
import { location_url } from '../../../config/config';
import { getSlugPath } from '../../../Utils/slug';
import { cachedGet, peekCached } from '../../../Utils/apiCache';
import { useLanguage, pickField } from '../../../context/LanguageContext';
const logo = '/assets/dasa.png';

const Footer = () => {
  const { user, logout } = useContext(AuthContext);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories]     = useState(() => peekCached('/getcat') || []);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [cartCount, setCartCount]       = useState(0);
    const [social, setSocial] = useState(() => peekCached('/socialmedia') || []);

  const syncCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cart.length);
  };

  useEffect(() => {
    syncCartCount();
    window.addEventListener('cartUpdated', syncCartCount);
    return () => window.removeEventListener('cartUpdated', syncCartCount);
  }, []);

  useEffect(() => {
    cachedGet('/getcat')
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories', err));
  }, []);

    useEffect(() => {
        cachedGet('/socialmedia')
            .then(data => setSocial(data))
            .catch(err => console.error("Error fetching social links:", err));
    }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const NavItem = ({ to, icon: Icon, label, onClick }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => { if (onClick) { onClick(); return; } navigate(to); }}
        className="flex-1 flex flex-col items-center justify-center py-2 px-1 group relative"
      >
        {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-teal-500 rounded-full" />}
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
          isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-500 group-hover:bg-slate-100 group-hover:text-teal-500'
        }`}>
          <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </div>
        <span className={`text-[10px]  font-medium ${isActive ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="bottom-0">
     
     
      <div className="footer lg:grid grid-cols-5 w-full hidden  gap-8 bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90% text-white   p-16">
         <nav className='w-[100%]'>
          <img className='w-[60%]' src={logo} alt="PriPackLab" />
          <p className='text-justify mt-3'>We provide high-quality printing, packaging, and labeling solutions designed to help your brand stand out with custom, professional, and reliable solutions tailored to your needs.
</p>
      </nav>
        
      

        {/* Categories span two columns as a 3-column grid so the footer stays short. */}
        <nav className='ml-12 col-span-2 w-full'>
          <h6 className="footer-title ">Product Categories</h6>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2 w-full text-sm">
            {categories.length > 0 ? categories.map(cat => (
              <Link
                key={cat._id}
                to={`/categorydetails/${getSlugPath(cat)}`}
                className="link link-hover text-left truncate"
                title={pickField(cat, 'catname', language)}
              >
                {pickField(cat, 'catname', language)}
              </Link>
            )) : (
              <><a className="link link-hover">Branding</a><a className="link link-hover">Design</a><a className="link link-hover">Marketing</a></>
            )}
          </div>
        </nav>
        <nav className='ml-12'>
          <h6 className="footer-title">Company</h6>
          <Link to="/aboutus" className="link link-hover text-left">About us</Link>
          <Link to="/faq" className="link link-hover text-left">FAQ</Link>
          <a className="link link-hover">Contact</a>
          <Link to="/privacy-policy" className="link link-hover text-left">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="link link-hover text-left">Terms & Conditions</Link>
          <Link to="/login" className="link link-hover text-left">Seller / Supplier login</Link>
          <Link to="/sellerregister" className="link link-hover text-left">Become a Seller</Link>
          <Link to="/supplierregister" className="link link-hover text-left">Become a Supplier</Link>
        </nav>
        <nav>
          <h6 className="footer-title">Social</h6>
          <div className="grid grid-flow-col gap-4">
           {social.map((item) => (
                <a key={item._id} href={item.sociallink} target="_blank" rel="noopener noreferrer">
                    <img
                        src={item.footerimglink}
                        className="md:h-10 md:w-10 rounded-full transform transition-transform duration-500 hover:scale-125"
                        alt={`Social link for ${item.sociallink}`}
                    />
                </a>
            ))}
          </div>
        </nav>      
       
      </div>
   
     <div className=' bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90%'>

      <hr className='mx-auto w-[90%] '/>
  
      <footer>
  <div className=" pl-16   pt-4">
    <p className="text-white">© 2026 Your Company. All rights reserved.</p>
  </div>
</footer>
     </div>
 
  


      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-[62px] px-2">

            <NavItem to="/" icon={Home} label="Home" />

            {/* Cart with live badge */}
            <button
              onClick={() => window.dispatchEvent(new Event("openCart"))}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 group-hover:bg-slate-100 group-hover:text-teal-500 transition-all duration-200">
                <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]  font-medium text-slate-400">Cart</span>
            </button>

            {/* Categories */}
            <button onClick={() => setShowCatSheet(true)} className="flex-1 flex flex-col items-center justify-center py-2 px-1 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl text-slate-500 group-hover:bg-slate-100 group-hover:text-teal-500 transition-all duration-200">
                <LayoutGrid className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-[10px]  font-medium text-slate-400">Categories</span>
            </button>

            {user ? (
              <>
                <NavItem to={profilePathFor(user)} icon={User}   label="Profile" />
                <NavItem icon={Power} label="Logout" onClick={handleLogout} />
              </>
            ) : (
              <NavItem to="/login" icon={LogIn} label="Login" />
            )}

          </div>
        </div>
      </div>

      {/* Categories Bottom Sheet */}
      {showCatSheet && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowCatSheet(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl shadow-2xl pb-8 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Categories</h3>
              <button onClick={() => setShowCatSheet(false)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pt-3">
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => { navigate(`/categorydetails/${getSlugPath(cat)}`); setShowCatSheet(false); }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all duration-200 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <img src={thumb(`${location_url}${cat.homepic || cat.pagecover}`, 96)} alt="" className="w-6 h-6 object-cover"
 />
                    </div>
                    <span className="text-sm font-medium text-slate-700 leading-tight">{pickField(cat, 'catname', language)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Footer;