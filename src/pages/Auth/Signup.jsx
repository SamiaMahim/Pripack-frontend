import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import "../../styles/login.css";
import { base_url } from "../../config/config";
const loginanimate = "/assets/login-animate.svg";

const ACCOUNT_TYPE_INFO = [
  { type: "Individual", detail: "Personal account for buying products for yourself." },
  { type: "Startup", detail: "For early-stage businesses sourcing products to launch or grow." },
  { type: "Corporate Office", detail: "For registered companies/organizations with bulk or ongoing needs." },
];
const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountType: "",
    email: "",
    phone: "",
    name: "",
    password: "",
    rePassword: "",
    address: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔐 Password match check
    if (formData.password !== formData.rePassword) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${base_url}/addcustomer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage("Signup successful!");
        setFormData({
          accountType: "",
          name: "",
          email: "",
          phone: "",
          password: "",
          rePassword: "",
          address: "",
        });

        setTimeout(() => navigate("/login"), 800);
      } else {
        setMessage("Signup failed. Try again.");
      }
    } catch (error) {
      console.log(error);
      setMessage("Server error. Try again later.");
    }
  };

  const passwordsMatch =
    formData.password && formData.rePassword &&
    formData.password === formData.rePassword;

  return (
    <div className="flex justify-center p-4 sm:p-8 lg:p-10">

            <div className="flex flex-col sm:flex-row justify-center lg:justify-evenly items-center w-full lg:max-w-6xl lg:mx-auto mt-4 sm:mt-6 gap-8 lg:gap-0">
                <img className="hidden sm:block sm:w-[55%] lg:w-[50%] justify-end items-end" src={loginanimate} alt="bg image" />


      <div className="lcont w-full lg:w-auto px-4 sm:px-8 lg:px-16 py-4 sm:py-6">

        <div className="ltit">Sign Up</div>

          <div className="lform">
          <form onSubmit={handleSubmit}>
            {/* Account Type */}
            <div>
              <label className="flex justify-center items-center gap-1.5">
                <span>Account Type</span>
                <span className="group relative inline-flex">
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                  <span className="pointer-events-none absolute right-0 top-full mt-2 w-64 rounded-lg bg-white text-white text-xs leading-relaxed p-3 opacity-0 scale-95 origin-top-right group-hover:opacity-100 group-hover:scale-100 border transition-all duration-150 z-10">
                    {ACCOUNT_TYPE_INFO.map(({ type, detail }) => (
                      <span key={type} className="block mb-1 last:mb-0 bg-white">
                        <b>{type}</b> : {detail}
                      </span>
                    ))}
                  </span> 
                </span>
              </label>
              <select
                name="accountType"
                className="select"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="">Select One</option>
                <option>Individual</option>
                <option>Startup</option>
                <option>Corporate Office</option>
              </select>
            </div>
 
            <div>
              <label><span>Name</span></label>
              <input
                type="text"
                name="name"
                placeholder="Enter your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
           
            <div>
              <label><span>Email</span></label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label><span>Phone</span></label>
              <input
                type="text"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label><span>Address</span></label>
              <input
                type="text"
                name="address"
                placeholder="Enter your full address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label><span>Password</span></label>
              <input
                type="password"
                name="password"
                placeholder="Enter a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label><span>Retype Password</span></label>
              <input
                type="password"
                name="rePassword"
                placeholder="Re-enter password"
                value={formData.rePassword}
                onChange={handleChange}
                required
              />

              {formData.rePassword && (
                <p
                  className={`text-sm mt-1 ${
                    passwordsMatch ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="mt-6 ">
              <button
                type="submit"
                disabled={!passwordsMatch}
                className={`${
                  passwordsMatch
                    ? "bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90% hover:scale-105 "
                    : " bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90% hover:scale-105 opacity-80  cursor-not-allowed"
                }`}
              >
                <p className="text-white">Sign Up</p>
              </button>
            </div>

            {message && (
              <p className="text-center mt-3 text-sm">{message}</p>
            )}
          </form>
           <div className="flex flex-row justify-center mb-2">
                      <p className="mr-2">Already have an account? </p>
                      <NavLink className="font-bold" to="/login">Log In</NavLink>
                    </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Signup;
