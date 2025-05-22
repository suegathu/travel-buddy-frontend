import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const HotelBookings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  const [place, setPlace] = useState(null);
  const [basePrice, setBasePrice] = useState(0);
  const [formData, setFormData] = useState({
    booking_date: new Date().toISOString().split("T")[0], // Today
    check_in: "",
    check_out: "",
    guests: 1,
    room_type: "",
    total_price: "0.00",
    payment_method: "mpesa",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch place (hotel) details
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const res = await fetch(`https://travel-buddy-backend-8kf4.onrender.com/api/places/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens?.access}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch place details");

        const data = await res.json();
        setPlace(data);
        
        // Ensure price is treated as a number
        const price = parseFloat(data.price) || 0;
        setBasePrice(price);
        setFormData((prev) => ({
          ...prev,
          total_price: price.toFixed(2),
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
    
    if (name === "guests") {
      const guests = Math.max(1, Number(value)); // Ensure at least 1 guest
      setFormData((prev) => {
        const updatedForm = { ...prev, guests };
        // Recalculate total price
        return {
          ...updatedForm,
          total_price: calculateTotalPrice(updatedForm).toFixed(2)
        };
      });
    } else {
      setFormData((prev) => {
        const updatedForm = { ...prev, [name]: value };
        // For check-in/check-out updates, recalculate total price
        if (name === "check_in" || name === "check_out") {
          return {
            ...updatedForm,
            total_price: calculateTotalPrice(updatedForm).toFixed(2)
          };
        }
        return updatedForm;
      });
    }
  };

  const calculateTotalPrice = (data = formData) => {
    const { guests, check_in, check_out } = data;
    if (!check_in || !check_out) return basePrice * guests;
    
    const numDays = Math.max(1, 
      Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 3600 * 24))
    );
    return basePrice * guests * numDays;
  };

  const validateForm = () => {
    if (!formData.check_in || !formData.check_out || !formData.room_type || formData.guests < 1) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (new Date(formData.check_out) <= new Date(formData.check_in)) {
      setError("Check-out must be after check-in.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const dataToSend = {
      booking_date: formData.booking_date,
      check_in: formData.check_in,
      check_out: formData.check_out,
      room_type: formData.room_type,
      total_price: parseFloat(formData.total_price),
      payment_method: formData.payment_method,
      place: id,
    };

    try {
      const response = await fetch("https://travel-buddy-backend-8kf4.onrender.com/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const booking = await response.json();
        // Navigate to payment page with relevant details
        navigate(`/payment/${booking.id}`, {
          state: {
            selectedPlace: place,
            selectedPrice: formData.total_price,
            bookingDetails: {
              checkIn: formData.check_in,
              checkOut: formData.check_out,
              guests: formData.guests,
              roomType: formData.room_type
            }
          }
        });
      } else {
        const errData = await response.json();
        alert(`Booking failed: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">Hotel Booking</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="booking_date" className="block text-sm font-medium text-gray-700">
            Booking Date
          </label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="check_in" className="block text-sm font-medium text-gray-700">
            Check-in Date
          </label>
          <input
            type="date"
            name="check_in"
            value={formData.check_in}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="check_out" className="block text-sm font-medium text-gray-700">
            Check-out Date
          </label>
          <input
            type="date"
            name="check_out"
            value={formData.check_out}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
            Number of Guests
          </label>
          <input
            type="number"
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            min="1"
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">
            Room Type
          </label>
          <select
            name="room_type"
            value={formData.room_type}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Room Type</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="total_price" className="block text-sm font-medium text-gray-700">
            Total Price
          </label>
          <input
            type="text"
            name="total_price"
            value={`Kes${formData.total_price}`}
            disabled
            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed shadow-sm focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="mpesa">M-Pesa</option>
            <option value="visa">Visa/PayPal</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!error}
          className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isSubmitting ? "Booking..." : "Book Hotel"}
        </button>
      </form>
    </div>
  );
};

export default HotelBookings;