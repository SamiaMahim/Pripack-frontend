import "../../styles/login.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../Auth/Authprovider";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { base_url } from "../../config/config";
const loginanimate = "/assets/login-animate.svg";
const Login = () => {
  const location = useLocation();
  const [emailOrPhone, setEmailOrPhone] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
  event.preventDefault();

  const loginData = { emailOrPhone, password };

  try {
    const response = await fetch(`${base_url}/customerlogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (data.success && data.token && data.user) {
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customerData", JSON.stringify(data.user));

      await login(data.token);

      if (data.user.atype === "seller") {
        navigate("/sellerprofile");
      } else if (data.user.atype === "supplier") {
        navigate("/supplierprofile");
      } else {
        navigate("/profile");
      }
    } else {
      setError(data.message || "Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    setError("An error occurred. Please try again.");
  }
};

  return (
    
  <div className="flex justify-center p-4 sm:p-8 lg:p-12">



        <div className="flex flex-col sm:flex-row justify-center lg:justify-evenly items-center w-full lg:max-w-6xl lg:mx-auto mt-10 sm:mt-16 lg:mt-20 gap-8 lg:gap-0">
          <img className="hidden sm:block sm:w-[55%] lg:w-[50%] justify-end items-end" src={loginanimate} alt="bg image" />



      <div className="lcont w-full lg:w-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-10">
        <div className="ltit ">Login now!</div>

        <div className="lform">
          <form onSubmit={handleLogin}>
            <div>
              <label>
                <span>Email / Phone</span>
              </label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Enter email or phone"
                required
              />
            </div>

            <div>
              <label>
                <span>Password</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-1 w-full lg:w-[350px]">
                <NavLink
                  to="/forgot-password"
                  state={emailOrPhone.includes("@") ? { email: emailOrPhone.trim() } : undefined}
                  className="text-sm text-sky-600 hover:underline"
                >
                  Forgot password?
                </NavLink>
              </div>
            </div>


            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="mt-6 sm:w-[90%]">
              <button className="bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90% hover:scale-105 text-white">Login</button>
            </div>
          </form>

          <div className="flex flex-row justify-center mb-2">
            <p className="mr-2">Don't have an account? </p>
            <NavLink className="font-bold" to="/signup">Sign Up</NavLink>
          </div>
        </div>
      </div>
        </div>
    </div>
  
  );
};

export default Login;
