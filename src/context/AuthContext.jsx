import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );

  const [user, setUser] = useState(() =>
    authTokens ? jwtDecode(authTokens.access) : null
  );

  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode(authTokens.access));
    }
  }, [authTokens]);

  const loginUser = async (username, password, userType = "user") => {
    try {
      const response = await axios.post("http://localhost:8000/api/users/login/", {
        username,
        password,
      });

      if (response.status === 200) {
        const data = response.data;
        setAuthTokens(data);

        const userData = jwtDecode(data.access);
        userData.userType = userType;

        if (userType === "admin") {
          userData.is_admin_user = true;
        }

        setUser(userData);
        localStorage.setItem("authTokens", JSON.stringify(data));

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
