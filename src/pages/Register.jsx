import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

const Register = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [registerStatus, setRegisterStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterStatus("Registering...");
    try {
      await axiosInstance.post("users/register/", form);
      setRegisterStatus("Registration successful!");
      setTimeout(() => {
        navigate("/"); // Navigate after success
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterStatus("Registration failed. Please try again.");
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
          src="images/register.jpg" 
          alt="Tropical island with turquoise water" 
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right side - Register form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-bl-full opacity-30" />
        
        <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg z-10">
          <h2 className="text-3xl font-bold mb-6">Create Account</h2>
          
          {registerStatus && (
            <div className={`p-3 mb-4 rounded ${
              registerStatus.includes("successful") 
                ? "bg-green-100 text-green-700" 
                : registerStatus.includes("error") || registerStatus.includes("failed")
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {registerStatus}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              name="username" 
              placeholder="Username" 
              className="w-full p-3 bg-gray-50 rounded border-0 focus:ring-2 focus:ring-cyan-400" 
              onChange={handleChange}
              value={form.username}
              required
            />
            
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              className="w-full p-3 bg-gray-50 rounded border-0 focus:ring-2 focus:ring-cyan-400" 
              onChange={handleChange}
              value={form.email}
              required
            />
            
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                className="w-full p-3 bg-gray-50 rounded border-0 focus:ring-2 focus:ring-cyan-400" 
                onChange={handleChange}
                value={form.password}
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
            
            <button 
              type="submit" 
              className="bg-cyan-500 text-white px-4 py-3 w-full hover:bg-cyan-600 rounded transition-colors font-medium"
            >
              Register
            </button>
            
            <div className="text-center mt-4">
              <p className="text-gray-600">Already have an Account? <a href="/" className="text-cyan-500 hover:text-cyan-600 font-medium">Login</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;