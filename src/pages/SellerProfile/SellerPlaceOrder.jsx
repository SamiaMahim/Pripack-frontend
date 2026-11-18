/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import { partnerRequest, taka } from "../../Utils/partnerApi";

const imgUrl = (src) => (!src ? null : src.startsWith("http") ? src : `${base_url}${src}`);
const lineKey = (productId, label) => `${productId}::${label}`;

// One catalog row: pick an option, quantity, then add it to the order.
const CatalogRow = ({ product, onAdd }) => {
  const orderable = product.variants.filter((v) => v.sellerPrice);
  const [label, setLabel] = useState(orderable[0]?.label || "");
  const [units, setUnits] = useState(1);
  const variant = orderable.find((v) => v.label === label);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 border border-slate-100 rounded-xl p-3">
      <div className="flex items-center gap-3 md:w-2/5">
        {product.image ? (
          <img src={imgUrl(product.image)} alt={product.productName} className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-100" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">{product.productName}</p>
          <p className="text-xs text-slate-400">{product.category}{product.subCategory ? ` · ${product.subCategory}` : ""}</p>
        </div>
      </div>

      {orderable.length === 0 ? (
        <p className="text-xs text-slate-400 md:flex-1">Seller price not set yet. Ask admin.</p>
      ) : (
        <>
          <select className="select select-bordered select-sm md:flex-1" value={label} onChange={(e) => setLabel(e.target.value)}>
            {orderable.map((v) => (
              <option key={v.label} value={v.label}>{v.label || "Standard"}</option>
            ))}
          </select>
          <div className="text-xs md:w-36">
            <p className="text-slate-500">Your price: <span className="font-semibold text-slate-800">{taka(variant?.sellerPrice)}</span></p>
            <p className="text-slate-400">Retail: {taka(variant?.retailPrice)}</p>
          </div>
          <input
            type="number"
            min={1}
            className="input input-bordered input-sm w-20"
            value={units}
            onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
          <button onClick={() => variant && onAdd(product, variant, units)} className="btn btn-sm bg-cyan-500 hover:bg-cyan-400 text-white border-none">
            Add
          </button>
        </>
      )}
    </div>
  );
};

const SellerPlaceOrder = ({ seller, onPlaced }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const [lines, setLines] = useState([]);
  const [orderFor, setOrderFor] = useState("customer");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canOrder = seller.status === "approved";

  useEffect(() => {
    setLoading(true);
    partnerRequest("/seller/catalog")
      .then((data) => {
        setProducts(data.products || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [seller.categories]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      (!category || p.category === category)
      && (!q || p.productName?.toLowerCase().includes(q) || p.subCategory?.toLowerCase().includes(q)));
  }, [products, category, search]);

  const addLine = (product, variant, units) => {
    const key = lineKey(product._id, variant.label);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, units: l.units + units } : l));
      return [...prev, {
        key,
        productId: product._id,
        productName: product.productName,
        variantLabel: variant.label,
        sellerPrice: variant.sellerPrice,
        sellingPrice: variant.retailPrice || variant.sellerPrice,
        units,
      }];
    });
  };

  const updateLine = (key, field, value) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  const removeLine = (key) => setLines((prev) => prev.filter((l) => l.key !== key));

  const priced = lines.map((l) => {
    const selling = orderFor === "self" ? l.sellerPrice : Number(l.sellingPrice) || 0;
    const cost = l.sellerPrice * l.units;
    const sell = selling * l.units;
    return { ...l, cost, sell, profit: sell - cost };
  });
  const totals = priced.reduce((t, l) => ({ cost: t.cost + l.cost, sell: t.sell + l.sell, profit: t.profit + l.profit }), { cost: 0, sell: 0, profit: 0 });

  const submit = async () => {
    if (!canOrder) return;
    if (!lines.length) return Swal.fire("No products", "Add at least one product to the order.", "warning");
    if (orderFor === "customer" && (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim())) {
      return Swal.fire("Customer details", "Enter the customer's name, phone and address.", "warning");
    }

    setSubmitting(true);
    try {
      const data = await partnerRequest("/seller/orders", {
        method: "POST",
        body: {
          orderFor,
          customer: orderFor === "customer" ? customer : undefined,
          note,
          items: lines.map((l) => ({
            productId: l.productId,
            variantLabel: l.variantLabel,
            units: l.units,
            sellingPrice: orderFor === "customer" ? Number(l.sellingPrice) : undefined,
          })),
        },
      });
      await Swal.fire("Order placed", `Order #${data.order.referenceCode} was sent to admin for verification.`, "success");
      setLines([]);
      setCustomer({ name: "", phone: "", address: "" });
      setNote("");
      onPlaced?.();
    } catch (err) {
      Swal.fire("Could not place order", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Loading your catalog...</div>;
  if (error) return <div className="py-10 text-center text-red-500">{error}</div>;
  if (!seller.categories.length) {
    return <div className="py-10 text-center text-gray-500">Select the categories you sell (Edit, on the left) to see products.</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <div className="xl:col-span-3">
        <div className="flex flex-wrap gap-2 mb-4">
          <select className="select select-bordered select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All my categories</option>
            {seller.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="search"
            className="input input-bordered input-sm flex-1 min-w-[160px]"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No products found in your categories.</p>
          ) : visible.map((p) => <CatalogRow key={p._id} product={p} onAdd={addLine} />)}
        </div>
      </div>

      <div className="xl:col-span-2 border border-slate-200 rounded-xl p-4 h-fit">
        <h3 className="font-semibold text-slate-800 mb-3">Order</h3>

        <div className="flex gap-2 mb-3">
          {[["customer", "For a customer"], ["self", "For myself"]].map(([value, text]) => (
            <button
              key={value}
              onClick={() => setOrderFor(value)}
              className={`btn btn-sm flex-1 ${orderFor === value ? "bg-cyan-500 hover:bg-cyan-400 text-white border-none" : "btn-outline"}`}
            >
              {text}
            </button>
          ))}
        </div>

        {orderFor === "customer" && (
          <div className="flex flex-col gap-2 mb-3">
            <input className="input input-bordered input-sm" placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            <input className="input input-bordered input-sm" placeholder="Customer phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            <input className="input input-bordered input-sm" placeholder="Delivery address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
          </div>
        )}

        {priced.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Add products from the list.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {priced.map((l) => (
              <div key={l.key} className="border border-slate-100 rounded-lg p-2 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-slate-800">{l.productName}<span className="text-slate-400"> · {l.variantLabel || "Standard"}</span></p>
                  <button onClick={() => removeLine(l.key)} className="text-xs text-red-500">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 items-end">
                  <label className="text-xs text-slate-500">Qty
                    <input type="number" min={1} className="input input-bordered input-xs w-full" value={l.units}
                      onChange={(e) => updateLine(l.key, "units", Math.max(1, parseInt(e.target.value, 10) || 1))} />
                  </label>
                  <label className="text-xs text-slate-500">Selling price
                    <input type="number" min={0} className="input input-bordered input-xs w-full" disabled={orderFor === "self"}
                      value={orderFor === "self" ? l.sellerPrice : l.sellingPrice}
                      onChange={(e) => updateLine(l.key, "sellingPrice", e.target.value)} />
                  </label>
                  <p className="text-xs text-slate-500">Your price<br /><span className="text-slate-800 font-medium">{taka(l.sellerPrice)}</span></p>
                </div>
                {orderFor === "customer" && (
                  <p className={`text-xs mt-1 ${l.profit < 0 ? "text-red-600" : "text-green-600"}`}>Profit: {taka(l.profit)}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <textarea className="textarea textarea-bordered textarea-sm w-full mt-3" placeholder="Note for admin (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="border-t mt-3 pt-3 text-sm flex flex-col gap-1">
          <div className="flex justify-between"><span className="text-slate-500">You pay (seller price)</span><span className="font-semibold">{taka(totals.cost)}</span></div>
          {orderFor === "customer" && (
            <>
              <div className="flex justify-between"><span className="text-slate-500">Customer pays</span><span className="font-semibold">{taka(totals.sell)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Your profit</span><span className={`font-bold ${totals.profit < 0 ? "text-red-600" : "text-green-600"}`}>{taka(totals.profit)}</span></div>
            </>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!canOrder || submitting || !lines.length}
          className="btn w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-white border-none"
        >
          {submitting ? "Placing..." : canOrder ? "Place order" : "Waiting for admin approval"}
        </button>
      </div>
    </div>
  );
};

export default SellerPlaceOrder;
