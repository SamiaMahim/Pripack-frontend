/* eslint-disable react/prop-types */
import ComboCard from "./ComboCard";
import { useLanguage } from "../../context/LanguageContext";

// Home page row of live combo packages; renders nothing when there are none.
const ComboList = ({ combos }) => {
  const { language } = useLanguage();
  if (!combos?.length) return null;

  return (
    <div className="bg-white">
      <div className="h-auto mt-10 w-full mb-10">
        <div className="flex flex-row justify-between items-center mx-2 mb-5">
          <h2 className="text-xl font-bold text-teal-500">
            {language === "bn" ? "কম্বো প্যাকেজ" : "Combo Packages"}
          </h2>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-3 px-1 scrollbar-hide">
          {combos.map((combo) => (
            <ComboCard key={combo._id} combo={combo} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComboList;
