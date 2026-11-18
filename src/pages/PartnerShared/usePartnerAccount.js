import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Auth/Authprovider";
import { partnerRequest } from "../../Utils/partnerApi";

// Loads the logged-in seller or supplier from /{kind}/me. The token only says
// who they are; status and categories are read fresh so an approval shows up
// without logging in again. Sends anyone else home, and expired tokens to login.
export default function usePartnerAccount(kind) {
  const navigate = useNavigate();
  const { user, loading, logout } = useContext(AuthContext);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await partnerRequest(`/${kind}/me`);
      setAccount(data[kind]);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        logout?.();
        navigate("/login");
        return;
      }
      setError(err.message);
    }
  }, [kind, logout, navigate]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.atype !== kind) {
      navigate("/");
      return;
    }
    reload();
  }, [user, loading, kind, navigate, reload]);

  return { account, setAccount, error, reload };
}
