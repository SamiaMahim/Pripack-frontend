/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import { partnerRequest } from "../../Utils/partnerApi";

// Building blocks shared by the seller and supplier profiles.

const CAN = { seller: "place orders", supplier: "receive orders" };

export const PartnerStatusNote = ({ kind, account }) => {
  const notes = {
    pending: {
      style: "bg-amber-50 border-amber-200 text-amber-800",
      title: "Your account is waiting for admin approval",
      text: `An admin will verify your NID and shop details. You can ${CAN[kind]} once your account is approved.`,
    },
    rejected: {
      style: "bg-red-50 border-red-200 text-red-800",
      title: `Your ${kind} application was not approved`,
      text: "Message the admin from the Admin Chat tab if you think this is a mistake.",
    },
    suspended: {
      style: "bg-red-50 border-red-200 text-red-800",
      title: `Your ${kind} account is suspended`,
      text: `You can't ${CAN[kind]} while your account is suspended. Message the admin for details.`,
    },
  };
  const note = notes[account?.status];
  if (!note) return null;
  return (
    <div className={`border rounded-xl px-4 py-3 mb-5 ${note.style}`}>
      <p className="font-semibold text-sm">{note.title}</p>
      <p className="text-sm mt-1">{note.text}</p>
      {account.statusNote && <p className="text-sm mt-1"><span className="font-semibold">Admin note:</span> {account.statusNote}</p>}
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm md:text-base font-medium text-slate-800 break-words mt-1">{value || "Not provided"}</p>
  </div>
);

const CategoryEditor = ({ kind, selected, onSaved, onClose }) => {
  const [all, setAll] = useState([]);
  const [picked, setPicked] = useState(selected);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/getcat`)
      .then((r) => r.json())
      .then((data) => setAll(Array.isArray(data) ? data : []))
      .catch(() => setAll([]));
  }, []);

  const toggle = (name) => setPicked((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const save = async () => {
    if (!picked.length) return Swal.fire("Select a category", "Pick at least one category.", "warning");
    setSaving(true);
    try {
      const data = await partnerRequest(`/${kind}/me/categories`, { method: "PUT", body: { categories: picked } });
      onSaved(data.categories);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800">{kind === "seller" ? "Categories you sell" : "Categories you produce"}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {kind === "seller" ? "You can order products only from these categories." : "Admin uses these to send you matching orders."}
        </p>
        <div className="mt-4 max-h-72 overflow-y-auto flex flex-col gap-2">
          {all.map((c) => (
            <label key={c._id} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" className="checkbox checkbox-sm" checked={picked.includes(c.catname)} onChange={() => toggle(c.catname)} />
              {c.catname}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn btn-sm btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn btn-sm bg-cyan-500 hover:bg-cyan-400 text-white border-none">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Left-hand profile card: shop picture, name, approval badge, contact details
// and editable categories.
export const PartnerCard = ({ kind, account, onCategoriesSaved }) => {
  const [editing, setEditing] = useState(false);
  const approved = account.status === "approved";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl w-full lg:w-[350px] shrink-0 shadow-sm overflow-hidden mb-6">
      {account.shopPic ? (
        <img src={`${base_url}${account.shopPic}`} alt="Shop" className="h-28 w-full object-cover" />
      ) : (
        <div className="h-28 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
      )}

      <div className="px-2 pb-2">
        <div className="flex items-end gap-4 -mt-10">
          <div className="w-20 h-20 ml-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white">
            {(account.shopName || account.name)?.slice(0, 1)?.toUpperCase() || "P"}
          </div>
          <div className="pb-1">
            <h2 className="text-xl font-bold text-slate-800">{account.shopName || account.name}</h2>
            <p className="text-sm text-slate-500">{account.shopName ? account.name : `${kind === "seller" ? "Seller" : "Supplier"} Account`}</p>
          </div>
        </div>

        <div className="mt-4 px-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {approved ? `Approved ${kind}` : account.status === "pending" ? "Pending approval" : account.status}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <InfoCard label="Email" value={account.email} />
          <InfoCard label="Phone" value={account.phone} />
          <InfoCard label="District" value={account.district || account.zilla || account.location} />
          <InfoCard label="Address" value={account.address} />
          <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {kind === "seller" ? "Categories I sell" : "Categories I produce"}
              </p>
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">Edit</button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {account.categories.length ? account.categories.map((c) => (
                <span key={c} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{c}</span>
              )) : <span className="text-sm text-slate-500">None selected</span>}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <CategoryEditor
          kind={kind}
          selected={account.categories}
          onClose={() => setEditing(false)}
          onSaved={(categories) => {
            onCategoriesSaved(categories);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
};

export const PartnerTabs = ({ tabs, active, onChange }) => (
  <div className="flex border-b overflow-x-auto">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-6 py-4 font-semibold text-sm whitespace-nowrap ${
          active === tab.id ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const PartnerPageState = ({ error, onRetry, label }) => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <p className="text-slate-500">{error || `Loading ${label}...`}</p>
    {error && <button onClick={onRetry} className="btn btn-sm">Retry</button>}
  </div>
);
