import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState({});
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseUrl = "https://travel-buddy-backend-8kf4.onrender.com";

  useEffect(() => {
    axiosInstance
      .get("users/profile/", {
        headers: { Authorization: `Bearer ${authTokens?.access}` },
      })
      .then((res) => {
        console.log("Profile data:", res.data);
        setProfile(res.data);
      });
  }, []);

  const handleRemoveImage = () => {
    axiosInstance
      .put(
        "users/profile/",
        { ...profile, profile_image: null },
        {
          headers: { Authorization: `Bearer ${authTokens?.access}` },
        }
      )
      .then((res) => setProfile(res.data));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const formattedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${baseUrl}${formattedPath}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        {profile.profile_image && (
          <div className="flex flex-col items-center mb-6">
            <img
              src={getImageUrl(profile.profile_image)}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover shadow-md"
              onError={(e) => console.error("Image failed to load:", e)}
            />
            <button
              onClick={handleRemoveImage}
              className="mt-3 bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition"
            >
              Remove Image
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 text-gray-700">
          <p>
            <span className="font-semibold">Username:</span> {profile.username}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {profile.email || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Full Name:</span> {profile.full_name || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Phone Number:</span> {profile.phone_number || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Address:</span> {profile.address || "N/A"}
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate("/edit-profile")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Edit Profile
          </button>
          <a
            href="/mytickets"
            className="text-blue-600 hover:underline text-sm sm:text-base"
          >
            View Place Bookings →
          </a>
          <a
            href="/flight-booking"
            className="text-blue-600 hover:underline text-sm sm:text-base"
          >
            View Flight Bookings →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;
