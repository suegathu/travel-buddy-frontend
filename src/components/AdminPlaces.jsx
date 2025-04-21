import { useState, useEffect, useContext } from "react";
import axiosInstance from "../api/axios";
import AuthContext from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const AdminPlaces = () => {
  const { authTokens } = useContext(AuthContext);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchCity, setFetchCity] = useState("");

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    category: "hotel",
    city: "",
    description: "",
    image_url: "",
    price: "",
  });

  useEffect(() => {
    fetchPlaces();
  }, [currentPage]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/places/?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      const data = res.data;
  
      // Check if paginated or flat list
      setPlaces(data.results || data);  // Use data.results if paginated, else raw array
      setTotalPages(data.total_pages || 1);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch places");
      toast.error("Failed to fetch places.", err);
      setLoading(false);
    }
  };
  
  const fetchFromOSM = async () => {
    if (!fetchCity) return toast.warn("Please enter a city");
  
    const categories = ["hotel", "restaurant", "attraction"];
  
    try {
      let allFetched = [];
  
      for (const type of categories) {
        const res = await axiosInstance.get(
          `/places/?city=${fetchCity}&type=${type}&refresh=true`,
          {
            headers: { Authorization: `Bearer ${authTokens.access}` },
          }
        );
  
        const fetched = Array.isArray(res.data) ? res.data : (res.data.results || []);
        allFetched = [...allFetched, ...fetched];
      }
  
      if (allFetched.length > 0) {
        toast.success(`Fetched ${allFetched.length} new places from OSM for ${fetchCity}`);
        setPlaces((prev) => [...allFetched, ...prev]);
      } else {
        toast.info(`No new places found for ${fetchCity}`);
      }
  
      setFetchCity("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data from OSM.");
    }
  };
  

  const handleDelete = async (id) => {
    if (window.confirm("Delete this place?")) {
      try {
        await axiosInstance.delete(`/places/${id}/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        toast.success("Place deleted successfully.");
        fetchPlaces();
      } catch (err) {
        toast.error("Failed to delete place.", err);
      }
    }
  };

  const handleEdit = (place) => {
    setFormData({
      ...place,
      category: place.place_type || place.category, // sync backend field
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    setFormData({
      id: null,
      name: "",
      category: "hotel",
      city: "",
      description: "",
      image_url: "",
      price: "",
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editMode ? "put" : "post";
    const url = editMode ? `/places/${formData.id}/` : "/places/";

    try {
      await axiosInstance[method](url, {
        ...formData,
        place_type: formData.category, // sync with backend
      }, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });

      toast.success(`Place ${editMode ? "updated" : "created"} successfully.`);
      fetchPlaces();
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to save place.", err);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Places</h1>
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Place
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={fetchCity}
          onChange={(e) => setFetchCity(e.target.value)}
          placeholder="Enter city to fetch places..."
          className="border px-3 py-2 rounded w-full max-w-xs"
        />
        <button
          onClick={fetchFromOSM}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Fetch from OSM
        </button>
      </div>

      {loading ? (
        <p>Loading places...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <div
              key={place.id}
              className="border rounded p-4 flex flex-col"
            >
              <div>
                <h2 className="font-semibold">{place.name}</h2>
                <p>{place.city} - {place.place_type || place.category}</p>
                <p className="mb-4">${place.price}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleEdit(place)}
                  className="bg-blue-500 text-white px-3 py-1 rounded flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(place.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Previous
        </button>
        <p>
          Page {currentPage} of {totalPages}
        </p>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl relative">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? "Edit Place" : "Add New Place"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="hotel">Hotel</option>
                <option value="restaurant">Restaurant</option>
                <option value="attraction">Attraction</option>
              </select>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="url"
                name="image_url"
                placeholder="Image URL"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {editMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlaces;