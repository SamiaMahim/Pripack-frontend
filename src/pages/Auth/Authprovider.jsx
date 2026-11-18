import { createContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { jwtDecode } from "jwt-decode";
import { syncCart, mergeGuestCart } from "../../Utils/cartApi";
import { unregisterPush } from "../../Utils/push";
// ✅ Remove Navigate import — it doesn't work outside JSX

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);   // ✅ all hooks INSIDE the component
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // ✅ moved inside

    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
        syncCart().catch((err) => console.error("Cart sync failed:", err));
    }, []);

    const login = (authToken) => {
        const decodedUser = jwtDecode(authToken);
        sessionStorage.removeItem("reviewPromptShown"); // fresh login → ask about pending reviews again
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("authUser", JSON.stringify(decodedUser));
        setToken(authToken);
        setUser(decodedUser);
        mergeGuestCart().catch((err) => console.error("Cart merge failed:", err));
    };

    const logout = async () => {
        // Kept so this browser's push token can still be removed on the backend.
        const sessionToken = localStorage.getItem("authToken") || localStorage.getItem("customerToken") || undefined;
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        // Written by the login page; SellerProfile falls back to customerData.
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerData");
        localStorage.removeItem("cart"); // the account's cart stays on the server
        setToken(null);
        setUser(null);
        // Stop push notifications for this account here (time-boxed, never blocks for long).
        await unregisterPush(sessionToken).catch(() => {});
        window.location.href = '/'; // ✅ Navigate() doesn't work outside JSX — use this instead
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthProvider;