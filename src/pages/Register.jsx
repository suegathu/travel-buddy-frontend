import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

const Register = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("users/register/", form);
      alert("Registered! Now login.");
      navigate("/"); // 👈 Navigate after success
    } catch (err) {
      console.error("Registration error:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" placeholder="Username" className="w-full border p-2" onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" className="w-full border p-2" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" className="w-full border p-2" onChange={handleChange} />
        <button className="bg-green-500 text-white px-4 py-2">Register</button>

        <p>Have an Account <a href="/">Login</a></p>
      </form>
    </div>
  );
};

export default Register;
