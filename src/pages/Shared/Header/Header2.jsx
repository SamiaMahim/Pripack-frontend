import { thumb } from '../../../Utils/thumb';
import logo from '/assets/dasa.png';
import { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Search from './Search';
import Search2 from './Search2';
import NavLabel from './NavLabel';
import NotificationBell from './NotificationBell';
import { navButtonClass, navIconClass } from './navStyles';
import { AuthContext } from '../../Auth/Authprovider';
import { profilePathFor } from '../../../Utils/partnerApi';
import Cart from '../../Cart/Cart';
import { LayoutGrid, Power, LogIn, Building2, Languages } from 'lucide-react';
import { base_url } from '../../../config/config';
import { cachedGet, peekCached } from '../../../Utils/apiCache';
import { getSlugPath } from '../../../Utils/slug';
import { useLanguage, pickField } from '../../../context/LanguageContext';
const Header2 = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onCategoryPage = pathname.startsWith('/categorydetails');
  const [categories, setCategories] = useState(() => peekCached('/getcat') || []);
 
  useEffect(() => {
    cachedGet('/getcat')
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories', err));
  }, []);
 
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="navbar bg-white flex justify-between lg:px-32 fixed top-0 left-0 right-0 z-10 shadow-sm">
      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between w-full">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/home" className="flex-shrink-0">
              <img
                className="w-[160px] h-10 lg:w-40 lg:h-10 object-contain"
                src={logo}
                alt="PriPackLab"
              />
            </NavLink>
          </div>

          <Search />

          <div className="flex items-center lg:space-x-5">

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="relative group/nav flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Switch language"
            >
              <NavLabel>Language</NavLabel>
              <Languages className="w-5 h-5 text-slate-600 hover:text-teal-600 transition group-hover/nav:scale-110" />
              <span className="hidden lg:inline text-xs font-semibold text-slate-600">
                {language === 'bn' ? 'বাং' : 'EN'}
              </span>
            </button>

            {/* About Us */}
            <NavLink
              to="/aboutus"
              className={({ isActive }) => `${navButtonClass(isActive)} lg:flex hidden`}
              aria-label="About Us"
            >
              {({ isActive }) => (
                <>
                  <Building2 className={navIconClass(isActive)} />
                  <NavLabel>About Us</NavLabel>
                </>
              )}
            </NavLink>

            {/* Categories dropdown */}
             <div className="group dropdown dropdown-end lg:block hidden">
              <div tabIndex={0} role="button" aria-label="Categories" className={`${navButtonClass(onCategoryPage)} cursor-pointer`}>
                <LayoutGrid className={navIconClass(onCategoryPage, 'group-hover:text-teal-600')} />
                <NavLabel>Categories</NavLabel>
              </div>
 
              {/* 3-column grid so all categories fit without a tall list. */}
              <div className="dropdown-content bg-white z-[1] w-[720px] max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto rounded-xl mt-3 shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-2">
                  Categories
                </p>
                <ul className="grid grid-cols-3 gap-1 px-2 pb-3">
                  {categories.map((cat) => (
                    <li key={cat._id}>
                      <NavLink
                        to={`/categorydetails/${getSlugPath(cat)}`}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        title={pickField(cat, 'catname', language)}
                      >
                        <img
                          src={thumb(`${base_url}${cat.homepic || cat.pagecover}`, 96)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                        />
                        <span className="text-sm text-slate-700 font-medium leading-tight line-clamp-2">
                          {pickField(cat, 'catname', language)}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
              </div>

            <NotificationBell />

            <Cart />

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1">
                {user.name && (
                  <NavLink
                    to={profilePathFor(user)}
                    title="Profile"
                    className="lg:inline hidden max-w-[120px] truncate border-2 border-teal-500 text-teal-600 text-sm font-semibold px-3 py-0.5 rounded-full hover:bg-teal-500 hover:text-white transition-colors"
                  >
                    {user.name}
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="relative group/nav lg:flex hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Logout"
                >
                  <Power className="w-5 h-5 text-slate-600 hover:text-red-500 transition group-hover/nav:scale-110" />
                  <NavLabel>Logout</NavLabel>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => `${navButtonClass(isActive)} lg:flex hidden`}
                aria-label="Sign In"
              >
                {({ isActive }) => (
                  <>
                    <LogIn className={navIconClass(isActive)} />
                    <NavLabel>Sign In</NavLabel>
                  </>
                )}
              </NavLink>
            )}

          </div>
        </div>

        <Search2 />
      </div>
    </div>
  );
};

export default Header2;