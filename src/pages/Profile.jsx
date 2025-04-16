import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState({});
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    // Fetching profile data
    axiosInstance.get("users/profile/", {
      headers: { Authorization: `Bearer ${authTokens?.access}` },
    }).then((res) => {
      console.log("Profile data:", res.data);
      setProfile(res.data);
    });
  }, []);

  const handleRemoveImage = () => {
    axiosInstance.put("users/profile/", {
      ...profile,
      profile_image: null,
    }, {
      headers: { Authorization: `Bearer ${authTokens?.access}` },
    }).then(res => setProfile(res.data));
  };

  // Function to handle image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${formattedPath}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>
      
      {profile.profile_image && (
        <div className="mb-4">
          <img
            src={getImageUrl(profile.profile_image)}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover"
            onError={(e) => {
              console.error("Image failed to load:", e);
            }}
          />
          <button
            onClick={handleRemoveImage}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
          >
            Remove Image
          </button>
        </div>
      )}
      
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email  || 'N/A'}</p>
      <p><strong>Full Name:</strong> {profile.full_name || "N/A"}</p>
      <p><strong>Phone Number:</strong> {profile.phone_number || "N/A"}</p>
      <p><strong>Address:</strong> {profile.address || "N/A"}</p>
      
      <button
        onClick={() => navigate("/edit-profile")}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Edit Profile
      </button>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">View My Bookings</h2>
        <p>
          <a 
            href="/mytickets" 
            className="text-blue-600 hover:underline"
          >
            Click here to view your bookings.
          </a>
        </p>
      </div>
    </div>
  );
};

export default Profile;
