import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

// Create a base URL that changes based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
      const response = await api.post("/api/users/login/", {
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
  
  // Add an axios interceptor to include the auth token in requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (authTokens) {
          config.headers.Authorization = `Bearer ${authTokens.access}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      // Clean up interceptor when component unmounts
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [authTokens]);

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    setUser,
    api, // Export the api instance for use in other components
  };
  
  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;