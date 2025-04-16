import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";

const EditUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    bio: "",
    profile_image: "",
    is_active: true,
    is_admin_user: false,
    created_at: "",
    last_login: "",
  });

  useEffect(() => {
    axiosInstance.get(`/users/admin/users/${id}/`)
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Failed to load user", err));
  }, [id]);

  const handleToggleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value === "true",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {
      is_active: userData.is_active,
      is_admin_user: userData.is_admin_user,
    };

    axiosInstance
      .patch(`/users/admin/users/${id}/`, updateData)
      .then(() => {
        alert("User status updated!");
        navigate("/admin");
      })
      .catch((err) => console.error("Failed to update user", err));
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">View User Info</h2>

      <div className="space-y-4">
        <div>
          <label className="block">Username</label>
          <input
            value={userData.username}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block">Email</label>
          <input
            value={userData.email}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block">First Name</label>
          <input
            value={userData.first_name}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block">Last Name</label>
          <input
            value={userData.last_name}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block">Bio</label>
          <textarea
            value={userData.bio}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>

        {userData.profile_image && (
          <div>
            <label className="block">Profile Image</label>
            <img
              src={userData.profile_image}
              alt="User profile"
              className="w-32 h-32 object-cover rounded-full"
            />
          </div>
        )}

        <div>
          <label className="block">Created At</label>
          <input
            value={new Date(userData.created_at).toLocaleString()}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block">Last Login</label>
          <input
            value={userData.last_login ? new Date(userData.last_login).toLocaleString() : "Never"}
            readOnly
            className="border bg-gray-100 rounded px-3 py-2 w-full"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block">Is Active</label>
            <select
              name="is_active"
              value={userData.is_active}
              onChange={handleToggleChange}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block">Is Admin User</label>
            <select
              name="is_admin_user"
              value={userData.is_admin_user}
              onChange={handleToggleChange}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="true">Admin</option>
              <option value="false">Regular</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Save Status
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;
