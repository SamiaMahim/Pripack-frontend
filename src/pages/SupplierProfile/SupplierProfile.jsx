import { useState } from "react";
import SupplierJobs from "./SupplierJobs";
import PartnerAdminChat from "../PartnerShared/PartnerAdminChat";
import usePartnerAccount from "../PartnerShared/usePartnerAccount";
import { PartnerCard, PartnerPageState, PartnerStatusNote, PartnerTabs } from "../PartnerShared/PartnerShared";
import { ProfileAd } from "../home/Ads/Ads";

const TABS = [
  { id: "jobs", label: "Orders" },
  { id: "admin", label: "Admin Chat" },
];

const SupplierProfile = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const { account: supplier, setAccount, error, reload } = usePartnerAccount("supplier");

  if (!supplier) return <PartnerPageState error={error} onRetry={reload} label="supplier profile" />;

  return (
    <div className="w-full px-3 md:px-6 lg:px-10 mt-20 flex flex-col lg:flex-row items-start gap-6 justify-start">
      <div className="w-full lg:w-[350px] shrink-0">
        <PartnerCard
          kind="supplier"
          account={supplier}
          onCategoriesSaved={(categories) => setAccount((prev) => ({ ...prev, categories }))}
        />
        <ProfileAd />
      </div>

      <div className="bg-white w-full border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <PartnerTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="p-5">
          <PartnerStatusNote kind="supplier" account={supplier} />
          {activeTab === "jobs" && <SupplierJobs canAct={supplier.status === "approved"} />}
          {activeTab === "admin" && <PartnerAdminChat />}
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile;
