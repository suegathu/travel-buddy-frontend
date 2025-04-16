import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [loginStatus, setLoginStatus] = useState("");
  
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus("Logging in...");
    
    try {
      // First handle the authentication
      const result = await loginUser(username, password);
      
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
      setLoginStatus(`Login error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Login</h1>
      
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
          className="w-full border p-2" 
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full border p-2" 
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          required
        />
        
        <div className="flex space-x-6">
          <div className="flex items-center">
            <input
              type="radio"
              id="user"
              name="userType"
              value="user"
              checked={userType === "user"}
              onChange={() => setUserType("user")}
              className="mr-2"
            />
            <label htmlFor="user">User</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="admin"
              name="userType"
              value="admin"
              checked={userType === "admin"}
              onChange={() => setUserType("admin")}
              className="mr-2"
            />
            <label htmlFor="admin">Admin</label>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 w-full hover:bg-blue-600"
        >
          Login
        </button>
        <p>Don't have an Account? <a href="/register">Sign Up</a></p>
      </form>
    </div>
  );
};

export default Login;