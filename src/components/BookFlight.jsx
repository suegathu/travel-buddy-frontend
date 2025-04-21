import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./BookFlight.css";

const BookFlight = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  const fetchAvailableSeats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.getAvailableSeats(flightId);
      console.log("API Response:", response);
      let seats = response.available_seats || response;
      if (!Array.isArray(seats)) throw new Error("Invalid seats format received.");
      setAvailableSeats(seats);
    } catch (err) {
      console.error("Error fetching seats:", err);
      setAvailableSeats([]);
      setError("Failed to fetch available seats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchAvailableSeats();
    }
  }, [navigate, flightId]);

  const handleBooking = async () => {
    if (!selectedSeat) {
      setError("Please select a seat.");
      return;
    }

    try {
      const response = await api.bookFlight(flightId, selectedSeat);
      console.log("Booking Response:", response);

      if (response && response.success) {
        setMessage(`Booking successful! Booking ID: ${response.booking_id}`);
        setError("");
        setSelectedSeat("");
        setBookingId(response.booking_id);
        navigate(`/checkin?booking_id=${response.booking.id}`);
      } else {
        throw new Error(response.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Error booking flight:", err);
      setError(err.message || "An error occurred while booking the flight.");
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) {
      setError("No booking to cancel.");
      return;
    }

    try {
      const response = await api.cancelBooking(bookingId);
      console.log("Cancel Response:", response);

      if (response && response.success) {
        setMessage("Booking cancelled successfully.");
        setError("");
        setBookingId(null);
      } else {
        throw new Error(response.message || "Failed to cancel the booking.");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError(err.message || "An error occurred while cancelling the booking.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Book Your Flight</h2>

      <label className="block text-lg font-medium mb-2">Select Your Seat:</label>

      {loading ? (
        <div className="text-center my-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <select
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          value={selectedSeat}
          onChange={(e) => setSelectedSeat(e.target.value)}
        >
          <option value="" disabled>Select a seat</option>
          {availableSeats.length > 0 ? (
            availableSeats.map((seat, index) => (
              <option key={index} value={seat}>{`Seat ${seat}`}</option>
            ))
          ) : (
            <option disabled>No seats available</option>
          )}
        </select>
      )}

      <button
        onClick={handleBooking}
        disabled={loading}
        className={`w-full py-2 px-4 text-white font-semibold rounded-lg transition duration-200 ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Confirm Booking
      </button>

      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {bookingId && (
        <button
          onClick={handleCancelBooking}
          disabled={loading}
          className="w-full mt-4 py-2 px-4 border border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition duration-200"
        >
          Cancel Booking
        </button>
      )}
    </div>
  );
};

export default BookFlight;
