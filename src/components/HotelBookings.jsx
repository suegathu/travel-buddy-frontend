import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const HotelBookings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  const [place, setPlace] = useState(null);
  const [formData, setFormData] = useState({
    booking_date: new Date().toISOString().split("T")[0], // Today
    check_in: "",
    check_out: "",
    guests: 1,
    room_type: "",
    total_price: 0,
    payment_method: "mpesa",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch place (hotel) details
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/places/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens?.access}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch place details");

        const data = await res.json();
        setPlace(data);
        setFormData((prev) => ({
          ...prev,
          total_price: data.price,
        }));
      } catch (err) {
        console.error("Failed to load place details", err);
        setError("Unable to load hotel details. Please try again later.");
      }
    };

    if (id && authTokens?.access) {
      fetchPlaceDetails();
    }
  }, [id, authTokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { check_in, check_out, room_type } = formData;
    if (!check_in || !check_out || !room_type) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (new Date(check_out) <= new Date(check_in)) {
      setError("Check-out must be after check-in.");
      return false;
    }
    setError("");
    return true;
  };

  const calculateTotalPrice = () => {
    const { guests, check_in, check_out } = formData;
    const numDays =
      (new Date(check_out) - new Date(check_in)) / (1000 * 3600 * 24);
    return (place?.price || 0) * guests * numDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!authTokens?.access) {
      setError("You must be logged in to book.");
      return;
    }

    setIsSubmitting(true);

    const bookingData = {
      ...formData,
      place: id,
      total_price: calculateTotalPrice().toFixed(2),
    };

    try {
      const response = await fetch("http://localhost:8000/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const booking = await response.json();
        alert("Booking successful!");
        navigate(`/payment/${booking.id}`);
      } else {
        const errData = await response.json();
        setError(errData?.message || "Booking failed. Try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      {place && (
        <>
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-56 object-cover rounded-lg mb-4"
          />
          <h2 className="text-2xl font-semibold mb-2">{place.name}</h2>
        </>
      )}

      <h3 className="text-xl font-medium mb-4">Hotel Booking Form</h3>
      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Booking Date</label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Check-in Date</label>
          <input
            type="date"
            name="check_in"
            value={formData.check_in}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Check-out Date</label>
          <input
            type="date"
            name="check_out"
            value={formData.check_out}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Number of Guests</label>
          <input
            type="number"
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            min="1"
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Room Type</label>
          <select
            name="room_type"
            value={formData.room_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select Room Type</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="visa">Visa/PayPal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Total Price</label>
          <input
            type="number"
            name="total_price"
            value={calculateTotalPrice()}
            readOnly
            className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Booking..." : "Confirm & Proceed to Payment"}
        </button>
      </form>

      {/* Link to My Tickets page */}
      <div className="mt-4 text-center">
        <Link to="/mytickets" className="text-blue-600 hover:underline">
          View My Bookings
        </Link>
      </div>
    </div>
  );
};

export default HotelBookings;
