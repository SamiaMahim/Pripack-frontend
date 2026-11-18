import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Footer from "../pages/Shared/Footer/Footer";
import Header2 from "../pages/Shared/Header/Header2";
import SupportChat from "../pages/supportchat/SupportChat";
import Social from "../pages/home/Home/Social";
import NotificationToast from "../pages/Notifications/NotificationToast";
const Main = () => {

  const location = useLocation();

  const noHeaderFooter =
    
    location.pathname.includes("Countdown");
      location.pathname.includes("Login");
      location.pathname.includes("Signup");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* New pages open at the top; back/forward return to where the user was. */}
      <ScrollRestoration getKey={(location) => location.pathname} />

      {!noHeaderFooter && <Header2 />}
 <SupportChat />
      <NotificationToast />
     
      <main className="flex-grow pb-16 lg:pb-0">
        <Social></Social>
        <Outlet />
      </main>

      {!noHeaderFooter && <Footer />}
    </div>
  );
};

export default Main;
