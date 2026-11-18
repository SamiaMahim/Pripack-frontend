/* eslint-disable react-refresh/only-export-components -- route config: lazy page components live next to the exported router */
import { lazy, Suspense } from "react";
import {
    createBrowserRouter,
  } from "react-router-dom";
import Main from "../Layout/main";
import Home from "../pages/home/Home/Home";
import ProductDetails from "../pages/Products/ProductDetails";
import CategoryDetails from "../pages/Category/CategoryDetails";
import NotFound from "../pages/NotFound/NotFound.jsx";
import Seo from "../Utils/Seo";
// import Productlist from "../pages/Products/Productlist";

// Pages off the main browsing path are split into their own chunks.
const Cart = lazy(() => import("../pages/Cart/Cart"));
const Checkout = lazy(() => import("../pages/Checkout/Checkout"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Login = lazy(() => import("../pages/Auth/Login"));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const CountDown = lazy(() => import("../Countdown/Countdown"));
const Signup = lazy(() => import("../pages/Auth/Signup"));
const Invoice = lazy(() => import("../pages/Invoice/Invoice"));
const RelatedCatDetails = lazy(() => import("../pages/Category/RelatedCatDetails.jsx"));
const Subcategory = lazy(() => import("../pages/Subcategory/Subcategory.jsx"));
const Faq = lazy(() => import("../pages/home/Faq/Faq.jsx"));
const PaymentGateway = lazy(() => import("../pages/Checkout/paymentGateway.jsx"));
const ComboDetails = lazy(() => import("../pages/Combo/ComboDetails.jsx"));
const AboutUs = lazy(() => import("../pages/Aboutus/AboutUs.jsx"));
const SellerProfile = lazy(() => import("../pages/SellerProfile/SellerProfile.jsx"));
const PartnerRegister = lazy(() => import("../pages/Auth/PartnerRegister.jsx"));
const SupplierProfile = lazy(() => import("../pages/SupplierProfile/SupplierProfile.jsx"));
const PrivacyPolicy = lazy(() => import("../pages/Legal/PrivacyPolicy.jsx"));
const TermsAndConditions = lazy(() => import("../pages/Legal/TermsAndConditions.jsx"));
const RiderOrderStatus = lazy(() => import("../pages/Rider/RiderOrderStatus.jsx"));
const NotificationsPage = lazy(() => import("../pages/Notifications/NotificationsPage.jsx"));

// Shown while a lazily loaded page's code downloads; tall enough that the footer doesn't jump up.
const PageFallback = () => (
  <div className="w-full min-h-[60vh] flex items-center justify-center" aria-busy="true">
    <span className="loading loading-spinner loading-md text-teal-500" />
  </div>
);
const page = (element) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

// Private / transactional pages: give them a tab title but keep them out of search results.
const privatePage = (title, element) => <><Seo title={title} noindex />{page(element)}</>;





  export const router = createBrowserRouter([
    {
      path: "/",
      element: <Main></Main>,
      errorElement: <NotFound></NotFound>,
      children: [
        {
            path: '/',
            element: <Home></Home>,

        },
{
            path: '/home',
            element: <Home></Home>,

        },
        {
          path: "/productdetails/:id",
          element: <ProductDetails />,
        },
        {
          path: "/combo/:id",
          element: page(<ComboDetails />),
        },
        {
          path: '/categorydetails/:id',
          element: <CategoryDetails></CategoryDetails>,

        },
         {
          path: '/relatedproducts/:id',
          element: page(<RelatedCatDetails />),

        },
        {
          path: '/subcategorydetails/:id',
          element: page(<Subcategory />),
        },
        {
          path: '/faq',
          element: page(<Faq />),
        },

        {
          path: '/paymentgateway',
          element: privatePage('Payment', <PaymentGateway />)
        },
        {
          path: '/cart',
          element: privatePage('Cart', <Cart />)
        }, 
        {
          path: '/checkout',
          element: privatePage('Checkout', <Checkout />)
        }, 
        {
          path: '/profile',
          element: privatePage('My Account', <Profile />)
        }, 
           {
          path: '/sellerprofile',
          element: privatePage('Seller Dashboard', <SellerProfile />)
        },
        {
          path: '/supplierprofile',
          element: privatePage('Supplier Dashboard', <SupplierProfile />)
        },
        {
          path: '/supplierregister',
          element: <><Seo title="Become a Supplier — Produce Printing & Packaging Orders" description="Join PriPackLab as a printing and packaging supplier and receive production orders from customers across Bangladesh." path="/supplierregister" />{page(<PartnerRegister kind="supplier" />)}</>
        }, 
        {
          path: '/notifications',
          element: privatePage('Notifications', <NotificationsPage />)
        },
        {
          path: '/login',
          element: privatePage('Login', <Login />)
        }, 
        {
          path: '/forgot-password',
          element: privatePage('Forgot Password', <ForgotPassword />)
        },
        {
          path: '/signup',
          element: privatePage('Sign Up', <Signup />)
        },
        {
          path: '/sellerregister',
          element: <><Seo title="Become a Seller — Sell Printing & Packaging Products in Bangladesh" description="Sell your printing and packaging products on PriPackLab and reach customers in all 64 districts of Bangladesh. Register as a seller today." keywords={["sell printing products online Bangladesh", "printing marketplace Bangladesh", "seller registration Bangladesh"]} path="/sellerregister" />{page(<PartnerRegister kind="seller" />)}</>
        },
          {
          path: '/aboutus',
          element: page(<AboutUs />)
        }, 
        {
          path:'/countdown',
          element: privatePage('Countdown', <CountDown />)
        },
        {
          path:'/invoice',
          element: privatePage('Invoice', <Invoice />)
        },
        {
          path: '/privacy-policy',
          element: page(<PrivacyPolicy />)
        },
        {
          path: '/terms-and-conditions',
          element: page(<TermsAndConditions />)
        },
        {
          path: '*',
          element: <NotFound></NotFound>
        }



        
      ]
    },
    {
      path: '/rider/order/:id',
      element: privatePage('Order Status', <RiderOrderStatus />)
    },

  ]);