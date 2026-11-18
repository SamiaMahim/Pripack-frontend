/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/login.css";
import { base_url } from "../../config/config";

const MAX_IMAGE_MB = 8;

// One image picker with a preview, so the seller can check they picked the
// right side of the NID before submitting.
const ImagePicker = ({ name, label, file, onChange }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <label><span>{label}</span></label>
      <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-lg p-2 cursor-pointer hover:bg-slate-50 w-full lg:w-[350px]">
        {preview ? (
          <img src={preview} alt={label} className="w-16 h-12 object-cover rounded" />
        ) : (
          <span className="w-16 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Image</span>
        )}
        <span className="text-sm text-slate-600 truncate">{file ? file.name : "Choose image"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onChange(name, e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
};

// Sign-up page for both sellers and suppliers. Same form; only the wording
// and the endpoint (/sellerregister or /supplierregister) differ.
const COPY = {
  seller: { title: "Become a Seller", shop: "Shop name", cats: "Categories you sell", after: "place orders" },
  supplier: { title: "Become a Supplier", shop: "Business / factory name", cats: "Categories you can produce", after: "receive orders" },
};

const PartnerRegister = ({ kind = "seller" }) => {
  const navigate = useNavigate();
  const copy = COPY[kind] || COPY.seller;

  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [files, setFiles] = useState({ nidFront: null, nidBack: null, shopPic: null });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/getcat`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
    fetch(`${base_url}/districts`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch(() => setDistricts([]));
  }, []);

  const toggleCategory = (catname) => {
    setSelectedCats((prev) => (prev.includes(catname) ? prev.filter((c) => c !== catname) : [...prev, catname]));
  };

  const setFile = (name, file) => {
    if (file && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setMessage(`Each image must be ${MAX_IMAGE_MB} MB or smaller.`);
      return;
    }
    setMessage("");
    setFiles((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    if (!selectedCats.length) return setMessage("Please select at least one category.");
    if (!files.nidFront || !files.nidBack) return setMessage("Please upload both sides of your NID.");
    if (!files.shopPic) return setMessage("Please upload a picture of your shop.");

    const body = new FormData();
    ["name", "shopName", "email", "phone", "password", "districtId", "address"].forEach((key) => {
      body.append(key, form[key].value.trim());
    });
    body.append("categories", JSON.stringify(selectedCats));
    body.append("nidFront", files.nidFront);
    body.append("nidBack", files.nidBack);
    body.append("shopPic", files.shopPic);

    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`${base_url}/${kind}register`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setMessage(`Registration successful! You can log in now. You can ${copy.after} once an admin approves your account.`);
        form.reset();
        setSelectedCats([]);
        setFiles({ nidFront: null, nidBack: null, shopPic: null });
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(data.message || "Registration failed. Try again.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server error. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lmain">
      <div className="lconts">
        <div className="ltit">{copy.title}</div>

        <div className="lform">
          <form onSubmit={handleSubmit}>
            <div>
              <label><span>Name</span></label>
              <input type="text" name="name" placeholder="Enter your name" required />
            </div>

            <div>
              <label><span>{copy.shop}</span></label>
              <input type="text" name="shopName" placeholder={`Enter your ${copy.shop.toLowerCase()}`} required />
            </div>

            <div>
              <label><span>Email</span></label>
              <input type="email" name="email" placeholder="Enter your email" required />
            </div>

            <div>
              <label><span>Phone</span></label>
              <input type="text" name="phone" placeholder="Enter your phone number" required />
            </div>

            <div>
              <label><span>Password</span></label>
              <input type="password" name="password" placeholder="At least 6 characters" minLength={6} required />
            </div>

            <div>
              <label><span>District</span></label>
              <select name="districtId" required defaultValue="">
                <option value="" disabled>Select your district</option>
                {districts.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label><span>Address</span></label>
              <input type="text" name="address" placeholder="Enter your full address" required />
            </div>

            <div>
              <label><span>{copy.cats}</span></label>
              <div className="dropdown w-full lg:w-[350px]">
                <div tabIndex={0} role="button" className="input input-bordered w-full flex items-center justify-between">
                  <span className="truncate text-sm">
                    {selectedCats.length ? selectedCats.join(", ") : "Select categories"}
                  </span>
                  <span className="text-xs text-slate-400">▼</span>
                </div>
                <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow bg-white rounded-box w-full max-h-64 overflow-y-auto flex-nowrap">
                  {categories.map((c) => (
                    <li key={c._id}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedCats.includes(c.catname)}
                          onChange={() => toggleCategory(c.catname)}
                        />
                        <span>{c.catname}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ImagePicker name="nidFront" label="NID (front side)" file={files.nidFront} onChange={setFile} />
            <ImagePicker name="nidBack" label="NID (back side)" file={files.nidBack} onChange={setFile} />
            <ImagePicker name="shopPic" label="Shop picture" file={files.shopPic} onChange={setFile} />

            <div className="mt-6">
              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Register"}
              </button>
            </div>

            {message && (
              <p className="text-center mt-3 text-sm">{message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegister;
