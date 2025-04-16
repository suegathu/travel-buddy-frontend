// src/components/PlaceForm.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import AuthContext from "../context/AuthContext";

const PlaceForm = () => {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams(); // if present, we're editing
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    category: "hotel", // hotel, restaurant, attraction
    city: "",
    description: "",
    image_url: "",
    price: "",
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      // Fetch the existing place details
      axiosInstance
        .get(`/places/${id}/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        })
        .then((res) => setFormData(res.data))
        .catch((err) => {
          console.error("Failed to fetch place:", err);
          setError("Failed to load place data.");
        });
    }
  }, [id, authTokens.access, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditMode ? `/places/${id}/` : "/places/";
    const method = isEditMode ? "put" : "post";

    try {
      await axiosInstance[method](url, formData, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      navigate("/admin/places");
    } catch (err) {
      console.error("Failed to save place:", err);
      setError("Failed to save place.");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">{isEditMode ? "Edit" : "Add"} Place</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Place Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
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
          className="w-full border px-4 py-2 rounded"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="url"
          name="image_url"
          placeholder="Image URL"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {isEditMode ? "Update" : "Create"} Place
        </button>
      </form>
    </div>
  );
};

export default PlaceForm;
