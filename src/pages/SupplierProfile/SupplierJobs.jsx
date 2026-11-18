/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import { partnerRequest } from "../../Utils/partnerApi";

const JOB_BADGE = {
  Assigned: "bg-amber-50 text-amber-700",
  "In Production": "bg-sky-50 text-sky-700",
  "Pickup Requested": "bg-indigo-50 text-indigo-700",
  "Picked Up": "bg-green-50 text-green-700",
};
const FILTERS = [
  { id: "active", label: "To do", match: (j) => ["Assigned", "In Production"].includes(j.supplierStatus) },
  { id: "pickup", label: "Waiting for pickup", match: (j) => j.supplierStatus === "Pickup Requested" },
  { id: "done", label: "Picked up", match: (j) => j.supplierStatus === "Picked Up" },
  { id: "all", label: "All", match: () => true },
];

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
const fileUrl = (p) => (p?.startsWith("http") ? p : `${base_url}${p}`);

const JobCard = ({ job, canAct, onChanged }) => {
  const [open, setOpen] = useState(job.supplierStatus === "Assigned");
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    const pickup = action === "pickup";
    const { value: note, isConfirmed } = await Swal.fire({
      title: pickup ? "Request pickup?" : "Start production?",
      text: pickup ? "A rider will be sent to collect this order." : "Let the admin know you've started on this order.",
      input: "text",
      inputPlaceholder: pickup ? "Pickup note, e.g. 3 cartons, ready after 4 PM (optional)" : "Note (optional)",
      showCancelButton: true,
      confirmButtonText: pickup ? "Request pickup" : "Start",
    });
    if (!isConfirmed) return;
    setBusy(true);
    try {
      await partnerRequest(`/supplier/jobs/${job.type}/${job._id}`, { method: "PATCH", body: { action, note } });
      onChanged();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap justify-between items-center gap-2 px-4 py-3 text-left hover:bg-slate-50">
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            #{job.referenceCode || String(job._id).slice(-6).toUpperCase()}
            <span className="ml-2 text-[10px] font-medium text-slate-400 uppercase">{job.type === "seller" ? "Seller order" : "Customer order"}</span>
          </p>
          <p className="text-xs text-slate-400">
            Assigned {formatDate(job.date)}{job.deliveryPeriod ? ` · Delivery: ${job.deliveryPeriod}` : ""} · {job.items.length} item(s)
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_BADGE[job.supplierStatus] || "bg-slate-100 text-slate-700"}`}>
          {job.supplierStatus}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 text-sm flex flex-col gap-3">
          {job.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              {item.image ? (
                <img src={fileUrl(item.image)} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0" />
              ) : <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{item.productName} <span className="text-slate-500">× {item.units}</span></p>
                {item.options.length > 0 && <p className="text-xs text-slate-500">{item.options.join(" · ")}</p>}
                {item.unitDetails.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {item.unitDetails.map((u, ui) => (
                      <div key={ui} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-bold text-teal-600">Unit {ui + 1}</p>
                        {u.description && <p className="text-xs text-slate-600 whitespace-pre-wrap">{u.description}</p>}
                        {u.filePath && (
                          <a href={fileUrl(u.filePath)} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">📎 Design file</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {job.supplierHistory.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">History</p>
              {job.supplierHistory.map((h, i) => (
                <p key={i} className="text-xs text-slate-500">{formatDate(h.date)} · {h.status}{h.note ? ` · ${h.note}` : ""}</p>
              ))}
            </div>
          )}

          {canAct && (
            <div className="flex flex-wrap justify-end gap-2">
              {job.supplierStatus === "Assigned" && (
                <button disabled={busy} onClick={() => act("start")} className="btn btn-sm btn-outline">Start production</button>
              )}
              {["Assigned", "In Production"].includes(job.supplierStatus) && (
                <button disabled={busy} onClick={() => act("pickup")} className="btn btn-sm bg-cyan-500 hover:bg-cyan-400 text-white border-none">
                  Order complete, request pickup
                </button>
              )}
            </div>
          )}
          {job.supplierStatus === "Pickup Requested" && <p className="text-xs text-indigo-600 text-right">Waiting for the rider to collect this order.</p>}
        </div>
      )}
    </div>
  );
};

const SupplierJobs = ({ canAct }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active");

  const load = useCallback(async () => {
    try {
      const data = await partnerRequest("/supplier/jobs");
      setJobs(data.jobs || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="py-10 text-center text-gray-500">Loading orders...</div>;
  if (error) return <div className="py-10 text-center text-red-500">{error}</div>;

  const current = FILTERS.find((f) => f.id === filter);
  const shown = jobs.filter(current.match);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`btn btn-xs ${filter === f.id ? "bg-cyan-500 hover:bg-cyan-400 text-white border-none" : "btn-ghost"}`}
          >
            {f.label} ({jobs.filter(f.match).length})
          </button>
        ))}
        <button onClick={load} className="btn-simple px-3 py-1.5 ml-auto">Refresh</button>
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No orders here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((job) => <JobCard key={`${job.type}-${job._id}`} job={job} canAct={canAct} onChanged={load} />)}
        </div>
      )}
    </div>
  );
};

export default SupplierJobs;
