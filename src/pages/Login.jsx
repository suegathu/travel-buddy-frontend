import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [loginStatus, setLoginStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus("Logging in...");
    setIsLoading(true);
    
    try {
      // Use the loginUser function from AuthContext
      const result = await loginUser(username, password, userType);
      
      if (result) {
        setLoginStatus("Login successful!");
        
        // Navigate based on user type selection
        if (userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setLoginStatus("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      // More informative error message using response data if available
      if (error.response && error.response.data) {
        const errorMsg = typeof error.response.data === 'object' 
          ? Object.values(error.response.data).flat().join(', ')
          : error.response.data;
        setLoginStatus(`Login failed: ${errorMsg}`);
      } else {
        setLoginStatus(`Login error: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      {/* Left side - Image with tagline */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 z-10" />
        <div className="absolute bottom-16 left-8 z-20 text-white">
          <h1 className="text-5xl font-bold mb-4">Capture Your Journeys</h1>
          <p className="text-xl max-w-md">
            Record your travel experience and memories in your personal travel journal.
          </p>
        </div>
        <img 
          src="images/login.webp" 
          alt="Tropical island with turquoise water" 
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-bl-full opacity-30" />
        
        <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg z-10">
          <h2 className="text-3xl font-bold mb-6">Login</h2>
          
          {loginStatus && (
            <div className={`p-3 mb-4 rounded ${
              loginStatus.includes("successful") 
                ? "bg-green-100 text-green-700" 
                : loginStatus.includes("error") || loginStatus.includes("failed")
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {loginStatus}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full p-3 bg-gray-50 rounded border-0 focus:ring-2 focus:ring-cyan-400" 
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              required
            />
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Password" 
                className="w-full p-3 bg-gray-50 rounded border-0 focus:ring-2 focus:ring-cyan-400" 
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button 
                type="button"
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            
            <div className="flex space-x-6 py-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="user"
                  name="userType"
                  value="user"
                  checked={userType === "user"}
                  onChange={() => setUserType("user")}
                  className="mr-2 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="user" className="text-gray-700">User</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="admin"
                  name="userType"
                  value="admin"
                  checked={userType === "admin"}
                  onChange={() => setUserType("admin")}
                  className="mr-2 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="admin" className="text-gray-700">Admin</label>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="bg-cyan-500 text-white px-4 py-3 w-full hover:bg-cyan-600 rounded transition-colors font-medium disabled:bg-cyan-300"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-gray-600">Don't have an Account? <a href="/register" className="text-cyan-500 hover:text-cyan-600 font-medium">Sign Up</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;