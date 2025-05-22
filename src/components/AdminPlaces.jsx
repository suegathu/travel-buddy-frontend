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
  const [fetchCity, setFetchCity] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    localOnly: false,
  });
  
  // Sorting state
  const [sortBy, setSortBy] = useState("newest"); // Default sort by newest

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
  }, [filters, sortBy]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      // Build query params - remove pagination parameters
      let queryParams = `limit=1000`; // Set a high limit to get all records
      
      // Add filters to query
      if (filters.name) queryParams += `&search=${filters.name}`;
      if (filters.category) queryParams += `&place_type=${filters.category}`;
      
      // Add localOnly filter to backend query
      if (filters.localOnly) queryParams += `&local_only=true`;
      
      const res = await axiosInstance.get(`/places/?${queryParams}`, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      
      let data = res.data;
      let filteredData = Array.isArray(data) ? data : (data.results || data);
      
      // Client-side filtering for price range
      if (filters.minPrice) {
        filteredData = filteredData.filter(place => 
          parseFloat(place.price) >= parseFloat(filters.minPrice)
        );
      }
      
      if (filters.maxPrice) {
        filteredData = filteredData.filter(place => 
          parseFloat(place.price) <= parseFloat(filters.maxPrice)
        );
      }
      
      // Apply sorting
      if (sortBy === "newest") {
        filteredData.sort((a, b) => 
          new Date(b.created_at || b.last_updated || 0) - 
          new Date(a.created_at || a.last_updated || 0)
        );
      } else if (sortBy === "oldest") {
        filteredData.sort((a, b) => 
          new Date(a.created_at || a.last_updated || 0) - 
          new Date(b.created_at || b.last_updated || 0)
        );
      } else if (sortBy === "price-low") {
        filteredData.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      } else if (sortBy === "price-high") {
        filteredData.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      } else if (sortBy === "name") {
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setPlaces(filteredData);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch places");
      toast.error("Failed to fetch places.", err);
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      name: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      localOnly: false,
    });
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  const fetchFromOSM = async () => {
    if (!fetchCity) return toast.warn("Please enter a city");
  
    const categories = ["hotel", "restaurant", "attraction"];
  
    try {
      let allFetched = [];
  
      for (const type of categories) {
        const res = await axiosInstance.get(
          `/places/?city=${fetchCity}&type=${type}&refresh=true&limit=1000`,
          {
            headers: { Authorization: `Bearer ${authTokens.access}` },
          }
        );
  
        const fetched = Array.isArray(res.data) ? res.data : (res.data.results || []);
        allFetched = [...allFetched, ...fetched];
      }
  
      if (allFetched.length > 0) {
        toast.success(`Fetched ${allFetched.length} new places from OSM for ${fetchCity}`);
        // Refresh the places list after fetching
        await fetchPlaces();
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

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Places ({places.length} total)</h1>
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Place
        </button>
      </div>

      {/* OSM Data Fetching */}
      <div className="flex items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
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

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button 
            onClick={resetFilters}
            className="text-indigo-600 text-sm"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by name"
              className="border px-3 py-2 rounded w-full"
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">All Categories</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
              <option value="attraction">Attraction</option>
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
          
          {/* Price range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (Kes)</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min Price"
              className="border px-3 py-2 rounded w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (Kes)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max Price"
              className="border px-3 py-2 rounded w-full"
            />
          </div>
          
          {/* Local Only checkbox */}
          <div className="flex items-center mt-7">
            <input
              type="checkbox"
              id="localOnly"
              name="localOnly"
              checked={filters.localOnly}
              onChange={handleFilterChange}
              className="h-4 w-4 text-indigo-600 rounded"
            />
            <label htmlFor="localOnly" className="ml-2 text-sm text-gray-700">
              Show locally created places only
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <p className="text-gray-500">Loading places...</p>
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : places.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No places found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <div
              key={place.id}
              className="border rounded p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-lg">{place.name}</h2>
                  {!place.osm_id && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Local</span>
                  )}
                </div>
                <p className="text-gray-600">{place.city} - {place.place_type || place.category}</p>
                <p className="mb-1 font-medium">Kes{place.price}</p>
                {place.rating && (
                  <p className="text-sm text-amber-600 mb-2">Rating: {place.rating}/5</p>
                )}
                {place.last_updated && (
                  <p className="text-xs text-gray-500 mb-3">
                    Last updated: {new Date(place.last_updated).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleEdit(place)}
                  className="bg-blue-500 text-white px-3 py-1 rounded flex-1 hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(place.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded flex-1 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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