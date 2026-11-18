import { useState } from "react";
import SellerPlaceOrder from "./SellerPlaceOrder";
import SellerOrders from "./SellerOrders";
import SellerChatInbox from "./SellerChatInbox";
import SellerDashboard from "./SellerDashboard";
import PartnerAdminChat from "../PartnerShared/PartnerAdminChat";
import usePartnerAccount from "../PartnerShared/usePartnerAccount";
import { PartnerCard, PartnerPageState, PartnerStatusNote, PartnerTabs } from "../PartnerShared/PartnerShared";
import { ProfileAd } from "../home/Ads/Ads";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "order", label: "Place Order" },
  { id: "orders", label: "My Orders" },
  { id: "messages", label: "Customer Messages" },
  { id: "admin", label: "Admin Chat" },
];

const SellerProfile = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { account: seller, setAccount, error, reload } = usePartnerAccount("seller");

  if (!seller) return <PartnerPageState error={error} onRetry={reload} label="seller profile" />;

  return (
    <div className="w-full px-3 md:px-6 lg:px-10 mt-20 flex flex-col lg:flex-row items-start gap-6 justify-start">
      <div className="w-full lg:w-[350px] shrink-0">
        <PartnerCard
          kind="seller"
          account={seller}
          onCategoriesSaved={(categories) => setAccount((prev) => ({ ...prev, categories }))}
        />
        <ProfileAd />
      </div>

      <div className="bg-white w-full border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <PartnerTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="p-5">
          <PartnerStatusNote kind="seller" account={seller} />
          {activeTab === "dashboard" && <SellerDashboard seller={seller} onNavigate={setActiveTab} />}
          {activeTab === "order" && <SellerPlaceOrder seller={seller} onPlaced={() => setActiveTab("orders")} />}
          {activeTab === "orders" && <SellerOrders />}
          {activeTab === "messages" && <SellerChatInbox seller={{ ...seller, userId: seller._id }} />}
          {activeTab === "admin" && <PartnerAdminChat />}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
