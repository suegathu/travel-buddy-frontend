import { useEffect, useState, useContext } from "react";
import axiosInstance from "../api/axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const { authTokens, user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth Tokens:", authTokens);
    console.log("User Object:", user);
    
    if (!authTokens || !authTokens.access) {
      navigate("/");
      return;
    }

    fetchUsers();
  }, [authTokens, user, navigate]);

  const fetchUsers = () => {
    setLoading(true);
    console.log("Fetching users with corrected URL...");
    
    // Use the correct API path
    axiosInstance
      .get("users/admin/users/", {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      })
      .then((res) => {
        console.log("Users API Response:", res);
        
        // Handle different response structures
        let userData = res.data;
        
        // Check if the response is paginated or has a results array
        if (res.data && typeof res.data === 'object') {
          if (Array.isArray(res.data.results)) {
            userData = res.data.results;
          } else if (!Array.isArray(res.data)) {
            // If it's an object but not an array, check for common wrapper properties
            userData = res.data.users || res.data.data || res.data.items || [];
          }
        }
        
        // Ensure we have an array
        userData = Array.isArray(userData) ? userData : [];
        
        console.log("Processed user data:", userData);
        setUsers(userData);
        setError(null);
      })
      .catch((err) => {
        console.error("Users API Error:", err);
        
        let errorMsg = "Failed to fetch users: ";
        if (err.response) {
          errorMsg += `Status ${err.response.status}`;
          if (err.response.data && err.response.data.detail) {
            errorMsg += ` - ${err.response.data.detail}`;
          }
        } else {
          errorMsg += err.message;
        }
        
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`users/admin/users/${id}/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        fetchUsers(); // refresh list
      } catch (err) {
        console.error("Failed to delete user:", err);
        setError("Failed to delete user: " + (err.response?.data?.detail || ""));
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/users/${id}/edit`);
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">All Users (Admin Only)</h1>
      
      {/* Loading/Error States */}
      {loading && <div className="p-4 bg-blue-100 rounded mb-4">Loading users...</div>}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Users List */}
      {!loading && !error && (
        <>
          <button 
            onClick={fetchUsers} 
            className="bg-green-500 text-white px-4 py-2 rounded mb-4"
          >
            Refresh Users
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length > 0 ? (
              users.map((u) => (
                <div 
                  key={u.id || u.user_id || u._id} 
                  className="border rounded p-4 flex flex-col"
                >
                  <div className="mb-4">
                    <h2 className="font-semibold">{u.username || u.name || u.email}</h2>
                    {u.email && <p>{u.email}</p>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleEdit(u.id || u.user_id || u._id)} 
                      className="bg-blue-500 text-white px-3 py-1 rounded flex-1"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id || u.user_id || u._id)} 
                      className="bg-red-500 text-white px-3 py-1 rounded flex-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">No users found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;