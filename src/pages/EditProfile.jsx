import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullname: "",
    address: "",
    bio: "",
    profile_image: null,
  });
  const [preview, setPreview] = useState(null);
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseUrl = "https://travel-buddy-7g6f.onrender.com"; // Add your backend URL here

  useEffect(() => {
    axiosInstance
      .get("users/profile/", {
        headers: { Authorization: `Bearer ${authTokens?.access}` },
      })
      .then((res) => {
        setFormData({
          ...res.data,
          profile_image: res.data.profile_image ? res.data.profile_image : null,
        });
        if (res.data.profile_image) {
          // Handle URL with or without base URL
          const imageUrl = res.data.profile_image.startsWith('http') 
            ? res.data.profile_image 
            : `${baseUrl}${res.data.profile_image}`;
          setPreview(imageUrl);
        }
      });
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "profile_image") {
      const file = e.target.files[0];
      setFormData({ ...formData, profile_image: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    // Add the form fields to FormData
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        if (key === 'profile_image' && formData[key] instanceof File) {
          // Only append profile_image if it's a file (new image selected)
          data.append(key, formData[key]);
        } else if (key !== 'profile_image') {
          // Append other fields
          data.append(key, formData[key]);
        }
      }
    }

    try {
      const response = await axiosInstance.put("users/profile/", data, {
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile updated!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="Username"
        />
        <input
          name="fullname"
          value={formData.fullname}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="Fullname"
        />
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="Address"
        />

        <textarea
          name="bio"
          value={formData.bio || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="Bio"
        />
        <div>
          <input 
            type="file" 
            name="profile_image" 
            onChange={handleChange} 
            className="mb-2"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-full mt-2 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png"; // Fallback image
              }}
            />
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
