import "../../styles/login.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { base_url } from "../../config/config";
const loginanimate = "/assets/login-animate.svg";

const CODE_LENGTH = 6;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 128;
const DEFAULT_RESEND_SECONDS = 60;
const DEFAULT_CODE_MINUTES = 10;

const gradientBtn =
  "bg-gradient-to-r from-indigo-500 from-20% via-sky-500 via-50% to-emerald-500 to-90% hover:scale-105 text-white disabled:opacity-60 disabled:hover:scale-100";

// POST JSON to the backend; throws an Error carrying the server's message on failure.
async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${base_url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Please try again.");
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok || data.success === false) {
    const fallback =
      response.status === 429
        ? "Too many attempts. Please wait a while and try again."
        : "Something went wrong. Please try again.";
    const err = new Error(data.message || fallback);
    err.status = response.status;
    throw err;
  }
  return data;
}

// Three steps: email -> 6-digit emailed code -> new password.
// The reset token from step 2 stays in component state only.
const ForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(location.state?.email || "");
  const [sentTo, setSentTo] = useState("");
  const [codeMinutes, setCodeMinutes] = useState(DEFAULT_CODE_MINUTES);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const codeInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const mismatch = confirm.length > 0 && password !== confirm;

  // Tick once a second while the resend button is cooling down.
  useEffect(() => {
    if (step !== 2 || resendAt <= Date.now()) return undefined;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      if (ts >= resendAt) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [step, resendAt]);

  // Focus the main field of each step.
  useEffect(() => {
    if (step === 2) codeInputRef.current?.focus();
    if (step === 3) passwordInputRef.current?.focus();
  }, [step]);

  // One request at a time, even on double click / Enter spam.
  const guarded = async (fn) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await fn();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const sendCode = (address) =>
    guarded(async () => {
      setError("");
      setInfo("");
      try {
        const data = await postJson("/forgotpassword", { email: address });
        const wait = Number(data.resendAfterSeconds) > 0 ? Number(data.resendAfterSeconds) : DEFAULT_RESEND_SECONDS;
        const ts = Date.now();
        setSentTo(address);
        setCodeMinutes(Number(data.codeMinutes) > 0 ? Number(data.codeMinutes) : DEFAULT_CODE_MINUTES);
        setNow(ts);
        setResendAt(ts + wait * 1000);
        setCode("");
        setInfo(data.message || "We sent a 6-digit code to your email.");
        setStep(2);
      } catch (err) {
        // No account / invalid email: go back to step 1 so it can be corrected.
        if (err.status === 404 || err.status === 400) setStep(1);
        setError(err.message);
      }
    });

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    sendCode(email.trim().toLowerCase());
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    guarded(async () => {
      setError("");
      try {
        const data = await postJson("/verifyresetcode", { email: sentTo, code });
        if (!data.resetToken) throw new Error("Something went wrong. Please try again.");
        setResetToken(data.resetToken);
        setInfo("");
        setStep(3);
      } catch (err) {
        setError(err.message);
      }
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password.length > MAX_PASSWORD) {
      setError(`Password can be at most ${MAX_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    guarded(async () => {
      try {
        const data = await postJson("/resetpassword", { resetToken, newPassword: password });
        setResetToken("");
        setPassword("");
        setConfirm("");
        setInfo(data.message || "Password reset. Sign in with your new password.");
        setStep(4);
      } catch (err) {
        // An expired reset session cannot be retried: start over from step 1.
        if (err.status === 400 && /session|token|expired/i.test(err.message)) {
          setResetToken("");
          setCode("");
          setPassword("");
          setConfirm("");
          setInfo("");
          setStep(1);
        }
        setError(err.message);
      }
    });
  };

  const changeEmail = () => {
    setError("");
    setInfo("");
    setCode("");
    setStep(1);
  };

  const title = step === 4 ? "Password reset!" : step === 3 ? "Set a new password" : "Forgot password?";
  const subtitle =
    step === 1
      ? "Enter your account email and we'll send you a 6-digit code."
      : step === 2
        ? "Enter the code we emailed you."
        : step === 3
          ? `Choose a password with at least ${MIN_PASSWORD} characters.`
          : "";

  return (
    <div className="flex justify-center p-4 sm:p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-center lg:justify-evenly items-center w-full lg:max-w-6xl lg:mx-auto mt-10 sm:mt-16 lg:mt-20 gap-8 lg:gap-0">
        <img className="hidden sm:block sm:w-[55%] lg:w-[50%] justify-end items-end" src={loginanimate} alt="bg image" />

        <div className="lcont w-full lg:w-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-10">
          <div className="ltit">{title}</div>
          {subtitle && <p className="text-sm text-gray-500 text-center -mt-2 max-w-[350px]">{subtitle}</p>}

          <div className="lform">
            {step === 1 && (
              <form onSubmit={handleEmailSubmit}>
                <div>
                  <label htmlFor="forgot-email">
                    <span>Email</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && <p role="alert" className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-6 sm:w-[90%]">
                  <button type="submit" className={gradientBtn} disabled={submitting}>
                    {submitting ? "Sending..." : "Send code"}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleCodeSubmit}>
                {info && !error && <p role="status" className="text-emerald-600 text-sm mb-2">{info}</p>}

                <p className="text-sm text-gray-600">
                  Code sent to <span className="font-semibold text-black break-all">{sentTo}</span>{" "}
                  <button type="button" className="text-sky-600 font-semibold hover:underline" onClick={changeEmail}>
                    Change email
                  </button>
                </p>

                <div>
                  <label htmlFor="forgot-code">
                    <span>6-digit code</span>
                  </label>
                  <input
                    ref={codeInputRef}
                    id="forgot-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={CODE_LENGTH}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                    placeholder="123456"
                    aria-describedby="forgot-code-help"
                    className="tracking-[0.5em] font-mono text-lg"
                    required
                  />
                  <p id="forgot-code-help" className="text-xs text-gray-500 mt-2">
                    The code expires in {codeMinutes} minutes. Can&apos;t find it? Check your spam folder.
                  </p>
                </div>

                {error && <p role="alert" className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-6 sm:w-[90%]">
                  <button type="submit" className={gradientBtn} disabled={submitting || code.length !== CODE_LENGTH}>
                    {submitting ? "Verifying..." : "Verify code"}
                  </button>
                </div>

                <div className="mt-3 sm:w-[90%]">
                  <div>
                    <button
                      type="button"
                      className="btn-simple w-full lg:w-[350px]"
                      disabled={submitting || resendIn > 0}
                      onClick={() => sendCode(sentTo)}
                    >
                      {resendIn > 0 ? `Resend code (${resendIn}s)` : "Resend code"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordSubmit}>
                <div>
                  <label htmlFor="reset-password">
                    <span>New password</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD}
                      maxLength={MAX_PASSWORD}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm">
                    <span>Confirm password</span>
                  </label>
                  <input
                    id="reset-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    maxLength={MAX_PASSWORD}
                    aria-invalid={mismatch || undefined}
                    className={mismatch ? "input-error" : ""}
                    required
                  />
                  {mismatch && <p className="text-xs text-red-500 mt-2">Passwords do not match</p>}
                </div>

                {error && <p role="alert" className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-6 sm:w-[90%]">
                  <button type="submit" className={gradientBtn} disabled={submitting || mismatch}>
                    {submitting ? "Saving..." : "Reset password"}
                  </button>
                </div>
              </form>
            )}

            {step === 4 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate("/login", { replace: true, state: { email: sentTo } });
                }}
              >
                <p role="status" className="text-emerald-600 text-center mb-2">{info}</p>
                <div className="mt-6 sm:w-[90%]">
                  <button type="submit" className={gradientBtn}>Go to login</button>
                </div>
              </form>
            )}

            {step < 4 && (
              <div className="flex flex-row justify-center mb-2 mt-4">
                <p className="mr-2">Remembered it?</p>
                <NavLink className="font-bold" to="/login">Login</NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
